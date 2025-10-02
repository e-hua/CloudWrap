import assumeRole from "../assumeRoleService.js";
import { listBuckets, addBucket, deleteBucket } from "./s3BucketService.js";
import dotenv from "dotenv";

dotenv.config();

const testARN = process.env.USER_ROLE_ARN;

const credential = await assumeRole(testARN);
console.log(credential);

const buckets = await listBuckets(credential);
console.log(buckets);

await addBucket(credential, "cloudwrap-test-bucket").catch((err) =>
  console.log("Error creating bucket: " + err)
);

const moreBuckets = await listBuckets(credential);
console.log(moreBuckets);

await deleteBucket(credential, "cloudwrap-test-bucket").catch((err) =>
  console.log("Error deleting bucket: " + err)
);

const lessBuckets = await listBuckets(credential);
console.log(lessBuckets);
