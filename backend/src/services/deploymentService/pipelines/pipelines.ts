import type { StrictCredentials } from "@/services/assumeRoleService.js";
import {
  CodePipelineClient,
  ListPipelineExecutionsCommand,
  ListPipelinesCommand,
} from "@aws-sdk/client-codepipeline";
import { STRICT_AWS_REGION as region } from "@/config/aws.config.js";

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

async function listAllPipelines(credential: StrictCredentials) {
  const pipelineClient = createPipeLineClient(credential);

  const command = new ListPipelinesCommand({});
  const response = await pipelineClient.send(command);

  return response.pipelines || [];
}

async function getPipelineHistory(
  credential: StrictCredentials,
  pipelineName: string
) {
  const pipelineClient = createPipeLineClient(credential);

  const command = new ListPipelineExecutionsCommand({
    pipelineName: pipelineName,
    maxResults: 50,
  });

  const response = await pipelineClient.send(command);
  return response.pipelineExecutionSummaries || [];
}

export { listAllPipelines, getPipelineHistory };
