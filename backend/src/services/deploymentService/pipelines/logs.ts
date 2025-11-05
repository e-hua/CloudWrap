import { type StrictCredentials } from "@/services/assumeRoleService.js";
import {
  CodePipelineClient,
  GetPipelineExecutionCommand,
  ListActionExecutionsCommand,
  PipelineExecutionStatus,
  type ActionExecutionDetail,
} from "@aws-sdk/client-codepipeline";
import { STRICT_AWS_REGION as region } from "@/config/aws.config.js";
import { getErrorMessage } from "@/utils/errors.js";
import {
  BatchGetBuildsCommand,
  CodeBuildClient,
} from "@aws-sdk/client-codebuild";
import {
  CloudWatchLogsClient,
  GetLogEventsCommand,
  type GetLogEventsCommandOutput,
} from "@aws-sdk/client-cloudwatch-logs";

function createPipeLineClient(credential: StrictCredentials) {
  return new CodePipelineClient({
    region: region,
    credentials: {
      accessKeyId: credential.AccessKeyId,
      secretAccessKey: credential.SecretAccessKey,
      sessionToken: credential.SessionToken,
    },
  });
}

function createCodeBuildClinet(credential: StrictCredentials) {
  return new CodeBuildClient({
    region: region,
    credentials: {
      accessKeyId: credential.AccessKeyId,
      secretAccessKey: credential.SecretAccessKey,
      sessionToken: credential.SessionToken,
    },
  });
}

function createCloudWatchClient(credential: StrictCredentials) {
  return new CloudWatchLogsClient({
    region: region,
    credentials: {
      accessKeyId: credential.AccessKeyId,
      secretAccessKey: credential.SecretAccessKey,
      sessionToken: credential.SessionToken,
    },
  });
}

type LogData = {
  data: string | ActionExecutionDetail[];
};

type PipelineLogData =
  | LogData
  | {
      source: "pipeline-status" | "sys-failure" | "sys-info";
    };

type BuildingLogData =
  | LogData
  | {
      source: "build-status" | "build-logs" | "sys-failure" | "sys-info";
    };

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

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
    pipelineExecutionId: executionId,
  });

  const actionCommand = new ListActionExecutionsCommand({
    pipelineName,
    filter: {
      pipelineExecutionId: executionId,
    },
  });

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
            data: `Pipeline running, current state: ${pipelineExecution.status}`,
          });
          info_sent = true;
        }
        // If the pipeline is already finished, then no need for SSE
      } else {
        running = false;
      }

      const details = await client.send(actionCommand);

      const curr_all_execution_details = details?.actionExecutionDetails ?? [];

      const curr_most_recent_action =
        curr_all_execution_details[curr_all_execution_details.length - 1];

      const curr_action_key = `
      ${curr_most_recent_action?.stageName}-
      ${curr_most_recent_action?.actionName}-
      ${curr_most_recent_action?.status}`;

      // Sending all the current statuses of the stages to client
      if (curr_action_key !== most_recent_status_key) {
        onStream({
          source: "pipeline-status",
          data: curr_all_execution_details,
        });
        most_recent_status_key = curr_action_key;
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
  let next_token = undefined;

  const codeBuildClient = createCodeBuildClinet(credential);
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
            data: `Code building, current status ${build?.buildStatus}`,
          });
          info_sent = true;
        }
        // The build is done, we can send all the logs in one pass
      } else {
        running = false;
      }

      const logMetaData = build?.logs;

      // If there're more log events
      if (logMetaData?.groupName && logMetaData?.streamName) {
        const logCommand = new GetLogEventsCommand({
          logGroupName: logMetaData?.groupName,
          logStreamName: logMetaData?.streamName,
          // Takes precedence if exists
          nextToken: next_token,
          // If there's no "nextToken", start from the beginning
          startFromHead: true,
        });

        const logs: GetLogEventsCommandOutput = await cloudWatchLogsClient.send(
          logCommand
        );

        for (const event of logs?.events ?? []) {
          onStream({ source: "build-logs", data: event.message });
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
