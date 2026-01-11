import {
  S3Client,
  ListBucketsCommand,
  CreateBucketCommand,
  DeleteBucketCommand
} from "@aws-sdk/client-s3";
import type { StrictCredentials } from "@/services/assumeRoleService.js";
import { getStrictAwsRegion } from "@/config/aws.config.js";

export async function listBuckets(credential: StrictCredentials) {
  const region = getStrictAwsRegion();
  const client = new S3Client({
    region,
    credentials: {
      accessKeyId: credential.AccessKeyId,
      secretAccessKey: credential.SecretAccessKey,
      sessionToken: credential.SessionToken
    }
  });

  const buckets = await client.send(new ListBucketsCommand({}));
  return buckets;
}

export async function addBucket(credential: StrictCredentials, newBucketName: string) {
  const region = getStrictAwsRegion();
  const client = new S3Client({
    region,
    credentials: {
      accessKeyId: credential.AccessKeyId,
      secretAccessKey: credential.SecretAccessKey,
      sessionToken: credential.SessionToken
    }
  });

  const input = {
    Bucket: newBucketName,
    CreateBucketConfiguration: {
      LocationConstraint: region
    }
  };

  const command = new CreateBucketCommand(input);
  await client.send(command);
}

export async function deleteBucket(credential: StrictCredentials, targetBucketName: string) {
  const region = getStrictAwsRegion();
  const client = new S3Client({
    region,
    credentials: {
      accessKeyId: credential.AccessKeyId,
      secretAccessKey: credential.SecretAccessKey,
      sessionToken: credential.SessionToken
    }
  });

  const input = {
    Bucket: targetBucketName
  };

  const command = new DeleteBucketCommand(input);
  await client.send(command);
}
