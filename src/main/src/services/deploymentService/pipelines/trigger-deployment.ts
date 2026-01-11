import type { StrictCredentials } from "@/services/assumeRoleService.js";
import { CodePipelineClient, StartPipelineExecutionCommand } from "@aws-sdk/client-codepipeline";
import { getStrictAwsRegion } from "@/config/aws.config.js";

function createCodePipelineClient(credential: StrictCredentials) {
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

// projectName: the name of the codepipeline
async function manualDeploy(credential: StrictCredentials, pipelineName: string) {
  const client = createCodePipelineClient(credential);

  const command = new StartPipelineExecutionCommand({
    name: pipelineName
  });

  const response = await client.send(command);
  return response;
}

export { manualDeploy };
