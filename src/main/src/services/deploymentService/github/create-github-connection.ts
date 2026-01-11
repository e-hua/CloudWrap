import type { StrictCredentials } from "@/services/assumeRoleService.js";
import {
  CodeStarConnectionsClient,
  CreateConnectionCommand
} from "@aws-sdk/client-codestar-connections";
import { getStrictAwsRegion } from "@/config/aws.config.js";

function createConnectionClient(credential: StrictCredentials) {
  const region = getStrictAwsRegion();

  return new CodeStarConnectionsClient({
    region,
    credentials: {
      accessKeyId: credential.AccessKeyId,
      secretAccessKey: credential.SecretAccessKey,
      sessionToken: credential.SessionToken
    }
  });
}

async function createGithubConnection(credential: StrictCredentials) {
  const client = createConnectionClient(credential);

  const command = new CreateConnectionCommand({
    ProviderType: "GitHub",
    ConnectionName: `cloudwrap-user-connection`
  });

  const response = await client.send(command);
  return response;
}

export { createGithubConnection };
