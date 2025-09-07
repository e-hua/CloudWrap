import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import dotenv from "dotenv";

dotenv.config();

const cloudWrapClient = new STSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/* 
Input: 
  roleArn: string
*/

/* 
Output: 
  credential {
    AccessKeyId,
    SecretAccessKey,
    SessionToken, 
    Expiration,
}
*/

export default async function assumeRole(roleArn) {
  // From https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_sts_code_examples.html
  const command = new AssumeRoleCommand({
    // The Amazon Resource Name (ARN) of the role to assume.
    RoleArn: roleArn,
    // An identifier for the assumed role session.
    RoleSessionName: "CloudWrapTestRoleSession",
    // The duration, in seconds, of the role session. The value specified
    // can range from 900 seconds (15 minutes) up to the maximum session
    // duration set for the role.
    DurationSeconds: 900,
  });

  const data = await cloudWrapClient.send(command);
  const credential = data.Credentials;
  return credential;
}
