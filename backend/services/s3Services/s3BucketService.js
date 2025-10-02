import {
  S3Client,
  ListBucketsCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
} from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION;

export async function listBuckets(credential) {
  const client = new S3Client({
    region: region,
    credentials: {
      accessKeyId: credential.AccessKeyId,
      secretAccessKey: credential.SecretAccessKey,
      sessionToken: credential.SessionToken,
    },
  });

  const buckets = await client.send(new ListBucketsCommand({}));
  return buckets;
}

export async function addBucket(credential, newBucketName) {
  const client = new S3Client({
    region: region,
    credentials: {
      accessKeyId: credential.AccessKeyId,
      secretAccessKey: credential.SecretAccessKey,
      sessionToken: credential.SessionToken,
    },
  });

  const input = {
    Bucket: newBucketName,
    CreateBucketConfiguration: {
      LocationConstraint: region,
    },
  };

  const command = new CreateBucketCommand(input);
  await client.send(command);
}

export async function deleteBucket(credential, targetBucketName) {
  const client = new S3Client({
    region: region,
    credentials: {
      accessKeyId: credential.AccessKeyId,
      secretAccessKey: credential.SecretAccessKey,
      sessionToken: credential.SessionToken,
    },
  });

  const input = {
    Bucket: targetBucketName,
  };

  const command = new DeleteBucketCommand(input);
  await client.send(command);
}
