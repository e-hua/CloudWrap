import {
  STSClient,
  AssumeRoleCommand,
  type Credentials,
} from "@aws-sdk/client-sts";

import {
  STRICT_AWS_REGION,
  STRICT_ACCESS_KEY,
  STRICT_SECRET_KEY,
  STRICT_ROLE_ARN,
} from "@/config/aws.config.js";

type StrictCredentials = {
  AccessKeyId: string;
  SecretAccessKey: string;
  SessionToken: string;
};

// These are the credentials for the cloudWrap offical account
// We need to set them up in production environment
const cloudWrapClient = new STSClient({
  region: STRICT_AWS_REGION,
  credentials: {
    accessKeyId: STRICT_ACCESS_KEY,
    secretAccessKey: STRICT_SECRET_KEY,
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
async function assumeRole(): Promise<StrictCredentials> {
  // From https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_sts_code_examples.html
  const command = new AssumeRoleCommand({
    // The Amazon Resource Name (ARN) of the role to assume.
    RoleArn: STRICT_ROLE_ARN,
    // An identifier for the assumed role session.
    RoleSessionName: "CloudWrapTestRoleSession",
    // The duration, in seconds, of the role session. The value specified
    // can range from 900 seconds (15 minutes) up to the maximum session
    // duration set for the role.
    DurationSeconds: 900,
  });

  const data = await cloudWrapClient.send(command);
  const credential = data.Credentials;

  if (!credential) {
    throw new Error(
      `Failed to assume role, please check if you have your client set up correctly`
    );
  }

  const StrictAccessKeyId = credential.AccessKeyId;
  const StrictSecretAccessKey = credential.SecretAccessKey;
  const StrictSessionToken = credential.SessionToken;
  if (!StrictAccessKeyId || !StrictSecretAccessKey || !StrictSessionToken) {
    throw new Error(
      "Invalid Credential Returned from assume role call: Missing attributes"
    );
  }

  return {
    AccessKeyId: StrictAccessKeyId,
    SecretAccessKey: StrictSecretAccessKey,
    SessionToken: StrictSessionToken,
  };
}

export { assumeRole };
export type { StrictCredentials };
