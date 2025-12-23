import type { _Object } from "@aws-sdk/client-s3";

async function fetchBuckets() {
  try {
    const response = await window.api.s3.listBuckets();
    if (response.success) {
      const result = response.data || []
      return result;
    } else {
      throw new Error(`Main thread error: ${response.error}`)
    }
  } catch (error) {
    console.error(error);
    return undefined
  }
}

async function deleteBucket(bucketName: string) {
  try {
    const response = await window.api.s3.deleteBucket(bucketName);
    console.log(response);
  } catch (error) {
    console.error(error);
  }
}

async function createBucket(bucketName: string) {
  try {
    const response = await window.api.s3.addBucket(bucketName)
    console.log(response);
  } catch (error) {
    console.error(error);
  }
}

async function fetchObjects(bucketName: string) {
  try {
    const response = await window.api.s3.listObjects(bucketName);

    if (!response.success) {
      throw new Error(response.error)
    }

    const result: _Object[] = response.data || [];
    return result;
  } catch (error) {
    console.error(error);
    return undefined
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
    const buffer = await file.arrayBuffer() 

    const response = await window.api.s3.uploadObject(bucketName, `${path}${itemName}`, buffer, file.type)
    if (response.success) {
      console.log(response.message)
    } else {
      throw new Error(response.error)
    }
  } catch (error) {
    console.error(error);
  }
}

async function deleteObject(bucketName: string, itemName: string, path = "") {
  try {
    const response = await window.api.s3.deleteObject(bucketName, `${path}${itemName}`);
    if (response.success) {
      console.log(response.message)
    } else {
      throw new Error(response.error)
    }
  } catch (error) {
    console.error(error);
  }
}

async function getObject(bucketName: string, itemName: string, path = "") {
  try {
    const response = await window.api.s3.getObject(bucketName, `${path}${itemName}`)
    if (response.success) {
      return new Blob([response.data.file],{ type: response.data.type })
    } else {
      throw new Error(response.error)
    }
  } catch (error) {
    console.error(error);
    return undefined
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
