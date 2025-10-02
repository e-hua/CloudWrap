import assumeRole from "../assumeRoleService.js";
import { listBuckets, addBucket, deleteBucket } from "./s3BucketService.js";
import {
  listObjects,
  putObject,
  deleteObject,
  getObject,
} from "./s3ObjectService.js";
import dotenv from "dotenv";

dotenv.config();

const testARN = process.env.USER_ROLE_ARN;

const credential = await assumeRole(testARN);

const oldFiles = await listObjects(credential, "cloudwrap-test-bucket");
console.log(oldFiles);

const response = await getObject(
  credential,
  "cloudwrap-test-bucket",
  "testfile"
);
console.log(response);

const files = await listObjects(credential, "cloudwrap-test-bucket");
console.log(files);
/*
await addBucket(credential, "cloudwrap-test-bucket").catch((err) =>
  console.log("Error creating bucket: " + err)
);

await putObject(
  credential,
  "cloudwrap-test-bucket",
  "testfile",
  "Hello, world"
);

const files = await listObjects(credential, "cloudwrap-test-bucket");
console.log(files);
*/
