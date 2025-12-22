import { BACKEND_ENDPOINT_URL } from "@/config/constants";
import type { S3_API_object } from "./s3.types";

const s3URL = `${BACKEND_ENDPOINT_URL}s3/`;

export type Bucket = {
  Name?: string | undefined;
  CreationDate?: string | undefined;
};

async function fetchBuckets() {
  try {
    const response = await fetch(`${s3URL}buckets/`, {
      method: "GET",
    });

    const result: Bucket[] = await response.json();
    return result;
  } catch (error) {
    console.error(error);
  }
}

async function deleteBucket(bucketName: string) {
  try {
    const response = await fetch(`${s3URL}buckets/${bucketName}`, {
      method: "DELETE",
    });
    console.log(response);
  } catch (error) {
    console.error(error);
  }
}

async function createBucket(bucketName: string) {
  try {
    const response = await fetch(`${s3URL}buckets/${bucketName}`, {
      method: "POST",
    });

    console.log(response);
  } catch (error) {
    console.error(error);
  }
}

async function fetchObjects(bucketName: string) {
  try {
    const response = await fetch(`${s3URL}buckets/${bucketName}`, {
      method: "GET",
    });
    const result: S3_API_object[] = await response.json();

    return result;
  } catch (error) {
    console.error(error);
  }
}

async function postObject(
  bucketName: string,
  itemName: string,
  file: File,
  path = ""
) {
  try {
    // appending the file to the body
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(
      `${s3URL}buckets/${bucketName}/${path}${itemName}`,
      {
        method: "POST",
        body: formData,
      }
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error(error);
  }
}

async function deleteObject(bucketName: string, itemName: string, path = "") {
  try {
    const response = await fetch(
      `${s3URL}buckets/${bucketName}/${path}${itemName}`,
      {
        method: "DELETE",
      }
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error(error);
  }
}

async function getObject(bucketName: string, itemName: string, path = "") {
  try {
    const response = await fetch(
      `${s3URL}buckets/${bucketName}/${path}${itemName}`,
      {
        method: "GET",
      }
    );
    const result = await response.blob();
    return result;
  } catch (error) {
    console.error(error);
  }
}

export {
  fetchBuckets,
  deleteBucket,
  createBucket,
  fetchObjects,
  postObject,
  deleteObject,
  getObject,
};
