import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import type { StrictCredentials } from "@/services/assumeRoleService.js";
import { STRICT_AWS_REGION as region } from "@/config/aws.config.js";

export async function listObjects(
  credential: StrictCredentials,
  bucketName: string
) {
  const client = new S3Client({
    region: region,
    credentials: {
      accessKeyId: credential.AccessKeyId,
      secretAccessKey: credential.SecretAccessKey,
      sessionToken: credential.SessionToken,
    },
  });

  const input = {
    Bucket: bucketName,
  };

  const command = new ListObjectsV2Command(input);
  const response = await client.send(command);

  return response;
}

export async function putObject(
  credential: StrictCredentials,
  bucketName: string,
  key: string,
  content: Buffer<ArrayBufferLike>,
  contentType: string
) {
  const client = new S3Client({
    region: region,
    credentials: {
      accessKeyId: credential.AccessKeyId,
      secretAccessKey: credential.SecretAccessKey,
      sessionToken: credential.SessionToken,
    },
  });

  const input = {
    Bucket: bucketName,
    Key: key,
    Body: content,
    ContentType: contentType,
  };

  const command = new PutObjectCommand(input);
  await client.send(command);
}

export async function deleteObject(
  credential: StrictCredentials,
  bucketName: string,
  key: string
) {
  const client = new S3Client({
    region: region,
    credentials: {
      accessKeyId: credential.AccessKeyId,
      secretAccessKey: credential.SecretAccessKey,
      sessionToken: credential.SessionToken,
    },
  });

  const input = {
    Bucket: bucketName,
    Key: key,
  };

  const command = new DeleteObjectCommand(input);
  const response = await client.send(command);
  return response;
}

export async function getObject(
  credential: StrictCredentials,
  bucketName: string,
  key: string
) {
  const client = new S3Client({
    region: region,
    credentials: {
      accessKeyId: credential.AccessKeyId,
      secretAccessKey: credential.SecretAccessKey,
      sessionToken: credential.SessionToken,
    },
  });

  const input = {
    Bucket: bucketName,
    Key: key,
  };

  const command = new GetObjectCommand(input);
  const body = (await client.send(command)).Body;
  if (!body) {
    throw new Error("The object we're trying to get does not exist");
  }
  const response = await body.transformToByteArray();
  return response;
}
