import type { StrictCredentials } from "@/services/assumeRoleService.js";
import {
  CodePipelineClient,
  StartPipelineExecutionCommand,
} from "@aws-sdk/client-codepipeline";
import { STRICT_AWS_REGION as region } from "@/config/aws.config.js";

function createCodePipelineClient(credential: StrictCredentials) {
  return new CodePipelineClient({
    region: region,
    credentials: {
      accessKeyId: credential.AccessKeyId,
      secretAccessKey: credential.SecretAccessKey,
      sessionToken: credential.SessionToken,
    },
  });
}

// projectName: the name of the codepipeline
async function manualDeploy(
  credential: StrictCredentials,
  projectName: string
) {
  const client = createCodePipelineClient(credential);

  const command = new StartPipelineExecutionCommand({
    name: projectName,
  });

  const response = await client.send(command);
  return response;
}

export { manualDeploy };
