import { getStrictAwsRegion } from "@/config/aws.config";
import { assumeRole } from "../assumeRoleService";
import {
  CodeStarConnectionsClient,
  GetConnectionCommand
} from "@aws-sdk/client-codestar-connections";

async function getGithubConnectionStatus(connectionArn: string) {
  const credential = await assumeRole();
  const region = getStrictAwsRegion();

  const client = new CodeStarConnectionsClient({
    region,
    credentials: {
      accessKeyId: credential.AccessKeyId,
      secretAccessKey: credential.SecretAccessKey,
      sessionToken: credential.SessionToken
    }
  });

  const command = new GetConnectionCommand({ ConnectionArn: connectionArn });
  const response = await client.send(command);
  return response.Connection?.ConnectionStatus;
}

export { getGithubConnectionStatus };
