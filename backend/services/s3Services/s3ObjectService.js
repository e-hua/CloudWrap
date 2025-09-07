import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const region = process.env.AWS_REGION;

export async function listObjects(credential, bucketName) {
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

export async function putObject(credential, bucketName, key, content) {
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
  };

  const command = new PutObjectCommand(input);
  await client.send(command);
}

export async function deleteObject(credential, bucketName, key) {
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

export async function getObject(credential, bucketName, key) {
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
  const response = await body.transformToByteArray();
  return response;
}
