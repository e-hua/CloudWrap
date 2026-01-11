import { ConfigManager } from "@/utils/ConfigManager";
import { BucketLocationConstraint } from "@aws-sdk/client-s3";

const VALID_REGIONS = Object.values(BucketLocationConstraint);

function isBucketLocationConstraint(value: string): value is BucketLocationConstraint {
  return VALID_REGIONS.includes(value as BucketLocationConstraint);
}

function getStrictAwsRegion(): BucketLocationConstraint {
  const appConfig = ConfigManager.getConfig();

  if (!appConfig.isOnboarded) {
    throw new Error("Application is not onboarded.");
  }

  if (!isBucketLocationConstraint(appConfig.awsRegion)) {
    throw new Error(
      `Invalid AWS region stored: ${appConfig.awsRegion}. Valid regions: ${VALID_REGIONS.join(", ")}`
    );
  }

  return appConfig.awsRegion as BucketLocationConstraint;
}

function getStrictTofuConfig() {
  const appConfig = ConfigManager.getConfig();

  if (!appConfig.isOnboarded) {
    throw new Error("Application is not onboarded.");
  }

  return {
    tfStateBucket: appConfig.tfStateBucket,
    tfProvisionRoleArn: appConfig.tfRoleARN,
    appServiceRoleArn: appConfig.roleARN
  };
}

function getStrictAwsCredentials() {
  const { accessKeyId, secretAccessKey } = ConfigManager.getSecrets();

  return {
    accessKeyId,
    secretAccessKey
  };
}

export { getStrictAwsRegion, getStrictTofuConfig, getStrictAwsCredentials };
