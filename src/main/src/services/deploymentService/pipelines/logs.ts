import { type StrictCredentials } from "@/services/assumeRoleService.js";
import {
  CodePipelineClient,
  GetPipelineExecutionCommand,
  GetPipelineStateCommand,
  ListActionExecutionsCommand,
  PipelineExecutionStatus,
  type ActionExecutionDetail
} from "@aws-sdk/client-codepipeline";
import { getStrictAwsRegion } from "@/config/aws.config.js";
import { getErrorMessage } from "@/utils/errors.js";
import { BatchGetBuildsCommand, CodeBuildClient } from "@aws-sdk/client-codebuild";
import {
  CloudWatchLogsClient,
  GetLogEventsCommand,
  type GetLogEventsCommandOutput
} from "@aws-sdk/client-cloudwatch-logs";
import { sleep } from "@/utils/sleep.js";

function createPipeLineClient(credential: StrictCredentials) {
  const region = getStrictAwsRegion();
  return new CodePipelineClient({
    region,
    credentials: {
      accessKeyId: credential.AccessKeyId,
      secretAccessKey: credential.SecretAccessKey,
      sessionToken: credential.SessionToken
    }
  });
}

function createCodeBuildClient(credential: StrictCredentials) {
  const region = getStrictAwsRegion();
  return new CodeBuildClient({
    region,
    credentials: {
      accessKeyId: credential.AccessKeyId,
      secretAccessKey: credential.SecretAccessKey,
      sessionToken: credential.SessionToken
    }
  });
}

function createCloudWatchClient(credential: StrictCredentials) {
  const region = getStrictAwsRegion();
  return new CloudWatchLogsClient({
    region,
    credentials: {
      accessKeyId: credential.AccessKeyId,
      secretAccessKey: credential.SecretAccessKey,
      sessionToken: credential.SessionToken
    }
  });
}

type LogData = {
  data: string | ActionExecutionDetail[];
};

type PipelineLogData = LogData & {
  source: "pipeline-status" | "sys-failure" | "sys-info";
};

type BuildingLogData = LogData & {
  source: "build-logs" | "sys-failure" | "sys-info";
};

// Keeps sending all the statuses in the pipeline
// Until the pipeline is finished running
async function streamPipelineStatus(
  credential: StrictCredentials,
  pipelineName: string,
  executionId: string,
  onStream: (data: PipelineLogData) => void
) {
  let running: boolean = true;
  let info_sent: boolean = false;
  let most_recent_status_key: string | undefined = undefined;

  const client = createPipeLineClient(credential);
  const executionCommand = new GetPipelineExecutionCommand({
    pipelineName,
    pipelineExecutionId: executionId
  });

  const actionCommand = new ListActionExecutionsCommand({
    pipelineName,
    filter: {
      pipelineExecutionId: executionId
    }
  });

  const stateCommand = new GetPipelineStateCommand({ name: pipelineName });

  while (running) {
    try {
      const response = await client.send(executionCommand);
      const pipelineExecution = response.pipelineExecution;

      // Send infos to the client if the pipeline is still running,
      // and the info was never sent to the client
      if (
        pipelineExecution?.status === PipelineExecutionStatus.InProgress ||
        pipelineExecution?.status === PipelineExecutionStatus.Stopping
      ) {
        if (!info_sent) {
          onStream({
            source: "sys-info",
            data: `Pipeline running, current state: ${pipelineExecution.status}`
          });
          info_sent = true;
        }
        // If the pipeline is already finished, then no need for SSE
      } else {
        running = false;
      }

      const [detailsResponse, stateResponse] = await Promise.all([
        client.send(actionCommand),
        client.send(stateCommand)
      ]);

      const curr_all_execution_details = detailsResponse?.actionExecutionDetails ?? [];
      const stageStates = stateResponse?.stageStates ?? [];

      const enriched_execution_details = curr_all_execution_details.map((detail) => {
        const matchingStage = stageStates.find((state) => state.stageName === detail.stageName);
        const matchingAction = matchingStage?.actionStates?.find(
          (state) => state.actionName === detail.actionName
        );

        if (matchingAction?.latestExecution?.externalExecutionId) {
          return {
            ...detail,
            // We inject the ID here so the frontend can read it
            output: {
              ...detail.output,
              executionResult: {
                ...detail.output?.executionResult,
                externalExecutionId: matchingAction.latestExecution.externalExecutionId
              }
            }
          };
        }
        return detail;
      });

      const current_state_signature = enriched_execution_details
        .map((elem) => `${elem.stageName}:${elem.actionName}:${elem.status}`)
        .join("|");

      // If the entire state fo the pipeline is different from the previous state
      // Send all the current statuses of the stages to client
      if (current_state_signature !== most_recent_status_key) {
        onStream({
          source: "pipeline-status",
          data: enriched_execution_details
        });
        most_recent_status_key = current_state_signature;
      }

      if (running) {
        await sleep(2000);
      }
    } catch (err) {
      onStream({ source: "sys-failure", data: getErrorMessage(err) });
      running = false;
    }
  }
}

// Keeps sending new logs of a specific CodeBuild
async function streamBuildLogs(
  credential: StrictCredentials,
  // The attribute came from pipelineExecution.status.data.output.executionResult.externalExecutionId
  buildExecutionId: string,
  onStream: (data: BuildingLogData) => void
) {
  let running: boolean = true;
  let info_sent: boolean = false;
  let next_token: string | undefined = undefined;

  const codeBuildClient = createCodeBuildClient(credential);
  const cloudWatchLogsClient = createCloudWatchClient(credential);
  const buildCommand = new BatchGetBuildsCommand({ ids: [buildExecutionId] });

  while (running || next_token) {
    try {
      const buildInfo = await codeBuildClient.send(buildCommand);

      const build = buildInfo?.builds?.[0];

      // The build is not completed, still in progress
      if (!build?.buildComplete) {
        if (!info_sent) {
          onStream({
            source: "sys-info",
            data: `Code building, current status ${build?.buildStatus}`
          });
          info_sent = true;
        }
        // The build is done, we can send all the logs in one pass
      } else {
        running = false;
      }

      const logMetaData = build?.logs;

      // If there are more log events
      if (logMetaData?.groupName && logMetaData?.streamName) {
        const logCommand = new GetLogEventsCommand({
          logGroupName: logMetaData?.groupName,
          logStreamName: logMetaData?.streamName,
          // Takes precedence if exists
          nextToken: next_token,
          // If there's no "nextToken", start from the beginning
          startFromHead: true
        });

        const logs: GetLogEventsCommandOutput = await cloudWatchLogsClient.send(logCommand);

        for (const event of logs?.events ?? []) {
          onStream({
            source: "build-logs",
            data: event.message ?? "No message"
          });
        }

        if (logs.nextForwardToken && logs.nextForwardToken !== next_token) {
          next_token = logs.nextForwardToken;
        } else {
          // If building is done, then it's time to stop
          if (!running) {
            next_token = undefined;
          }
        }

        if (running) {
          await sleep(2000);
        }
      }
    } catch (err) {
      onStream({ source: "sys-failure", data: getErrorMessage(err) });
      running = false;
      next_token = undefined;
    }
  }
}

export { streamPipelineStatus, streamBuildLogs };
export type { PipelineLogData, BuildingLogData };
