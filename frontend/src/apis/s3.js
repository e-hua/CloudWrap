import { BACKEND_ENDPOINT_URL } from "../config/constants";

const s3URL = `${BACKEND_ENDPOINT_URL}s3/`;

async function fetchBuckets(ARN = "") {
  try {
    const response = await fetch(`${s3URL}buckets/`, {
      method: "GET",
      headers: {
        ARN,
      },
    });

    const result = response.json();
    return result;
  } catch (error) {
    console.log(error);
  }
}

async function deleteBucket(bucketName, ARN = "") {
  try {
    const response = await fetch(`${s3URL}buckets/${bucketName}`, {
      method: "DELETE",
      headers: {
        ARN,
      },
    });
    console.log(response);
  } catch (error) {
    console.log(error);
  }
}

async function createBucket(bucketName, ARN = "") {
  try {
    const response = await fetch(`${s3URL}buckets/${bucketName}`, {
      method: "POST",
      headers: {
        ARN,
      },
    });

    console.log(response);
  } catch (err) {
    console.log(err);
  }
}

async function fetchObjects(bucketName, ARN = "") {
  try {
    const response = await fetch(`${s3URL}buckets/${bucketName}`, {
      method: "GET",
      headers: {
        ARN,
      },
    });
    const result = await response.json();
    return result;
  } catch (err) {
    console.log(err);
  }
}

async function postObject(bucketName, itemName, file, path = "", ARN = "") {
  try {
    // appending the file to the body
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(
      `${s3URL}buckets/${bucketName}/${path}${itemName}`,
      {
        method: "POST",
        headers: {
          ARN,
        },
        body: formData,
      }
    );
    const result = await response.json();
    return result;
  } catch (err) {
    console.log(err);
  }
}

async function deleteObject(bucketName, itemName, path = "", ARN = "") {
  try {
    const response = await fetch(
      `${s3URL}buckets/${bucketName}/${path}${itemName}`,
      {
        method: "DELETE",
        headers: {
          ARN,
        },
      }
    );
    const result = await response.json();
    return result;
  } catch (err) {
    console.log(err);
  }
}

async function getObject(bucketName, itemName, path = "", ARN = "") {
  try {
    const response = await fetch(
      `${s3URL}buckets/${bucketName}/${path}${itemName}`,
      {
        method: "GET",
        headers: {
          ARN,
        },
      }
    );
    const result = await response.blob();
    return result;
  } catch (err) {
    console.log(err);
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
