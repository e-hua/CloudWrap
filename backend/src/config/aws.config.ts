import { BucketLocationConstraint } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

const AWS_REGION = process.env.AWS_REGION;
const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID;
const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const ROLE_ARN = process.env.USER_ROLE_ARN;
const TF_STATE_BUCKET = process.env.AWS_TF_STATE_BUCKET;
const TF_ROLE_ARN = process.env.AWS_TF_ROLE_ARN;

if (
  !AWS_REGION ||
  !ACCESS_KEY ||
  !SECRET_KEY ||
  !ROLE_ARN ||
  !TF_STATE_BUCKET ||
  !TF_ROLE_ARN
) {
  // Explain the error
  throw new Error(
    `Missing critical environment variables 
    (AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, 
    USER_ROLE_ARN, AWS_TF_STATE_BUCKET, AWS_TF_ROLE_ARN). 
    Please check your .env file or deployment environment.`
  );
}

const VALID_REGIONS = Object.values(BucketLocationConstraint);

function isBucketLocationConstraint(
  value: string
): value is BucketLocationConstraint {
  return VALID_REGIONS.includes(value as BucketLocationConstraint);
}

if (!isBucketLocationConstraint(AWS_REGION)) {
  throw new Error(
    `Invalid AWS region: ${AWS_REGION}, please check if the value matches any of the values in ${VALID_REGIONS}`
  );
}

const STRICT_AWS_REGION: BucketLocationConstraint & string = AWS_REGION;
const STRICT_ACCESS_KEY: string = ACCESS_KEY;
const STRICT_SECRET_KEY: string = SECRET_KEY;
const STRICT_ROLE_ARN: string = ROLE_ARN;
const STRICT_TF_STATE_BUCKET: string = TF_STATE_BUCKET;
const STRICT_TF_ROLE_ARN: string = TF_ROLE_ARN;

export {
  STRICT_AWS_REGION,
  STRICT_ACCESS_KEY,
  STRICT_SECRET_KEY,
  STRICT_ROLE_ARN,
  STRICT_TF_STATE_BUCKET,
  STRICT_TF_ROLE_ARN,
};
