import type { StrictCredentials } from "@/services/assumeRoleService.js";
import {
  CodeStarConnectionsClient,
  CreateConnectionCommand,
} from "@aws-sdk/client-codestar-connections";
import { STRICT_AWS_REGION as region } from "@/config/aws.config.js";

function createConnectionClient(credential: StrictCredentials) {
  return new CodeStarConnectionsClient({
    region: region,
    credentials: {
      accessKeyId: credential.AccessKeyId,
      secretAccessKey: credential.SecretAccessKey,
      sessionToken: credential.SessionToken,
    },
  });
}

async function createGithubConnection(credential: StrictCredentials) {
  const client = createConnectionClient(credential);

  const command = new CreateConnectionCommand({
    ProviderType: "GitHub",
    ConnectionName: `cloudwrap-user-connection`,
  });

  const response = await client.send(command);
  return response;
}

export { createGithubConnection };
