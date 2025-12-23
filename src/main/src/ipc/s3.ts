import { assumeRole } from "@/services/assumeRoleService";
import { addBucket, deleteBucket, listBuckets } from "@/services/s3Services/s3BucketService";
import { deleteObject, getObject, listObjects, putObject } from "@/services/s3Services/s3ObjectService";
import { getErrorMessage } from "@/utils/errors";
import { ipcMain } from "electron";

function setupS3Handler() {
  ipcMain.handle("s3:list-buckets", async () => {
    try {
      const credential = await assumeRole();
      const buckets = await listBuckets(credential);
  
      return { success: true, data: buckets.Buckets }
    } catch (error) {
      return { success: false, error: getErrorMessage(error) }
    }
  })

  ipcMain.handle('s3:add-bucket', async (_, bucketName: string) => {
    try {
      const credential = await assumeRole()
      await addBucket(credential, bucketName)
      return { success: true, message: "Bucket created" }
    } catch (err) {
      return { success: false, error: getErrorMessage(err) }
    }
  })

  ipcMain.handle("s3:delete-bucket", async (_, bucketName: string) => {
    try {
      const credential = await assumeRole();
      await deleteBucket(credential, bucketName);
      return { success: true, message: "Bucket deleted" }
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) }
    }
  }) 

  ipcMain.handle("s3:list-objects", async (_, bucketName: string) => {
    try {
      const credential = await assumeRole();
      const objects = await listObjects(credential, bucketName);
      return { success: true, data: objects }
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) }
    }
  }) 

  
  ipcMain.handle("s3:upload-object", async (_,{ bucketName, objectName, buffer, mimeType}) => {
    try {
      const credential = await assumeRole();
      const nodeBuffer = Buffer.from(buffer);

      await putObject(credential, bucketName, objectName, nodeBuffer, mimeType);
      return { success: true, message: "Object uploaded" }
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) }
    }
  }) 

  ipcMain.handle("s3:delete-object", async (_, {bucketName, objectName}) => {
    try {
      const credential = await assumeRole();
      await deleteObject(credential, bucketName, objectName);

      return { success: true, message: "Object deleted" }
    } catch(error) {
      return { success: false, error: getErrorMessage(error) }
    }
  }) 

  ipcMain.handle("s3:get-object", async (_, {bucketName, objectName}) => {
    try {
      const credential = await assumeRole();
      const {byteArray: file, type} = await getObject(credential, bucketName, objectName);

      return { success: true, data: {file, type}}
    } catch(error) {
      return { success: false, error: getErrorMessage(error) }
    }
  }) 
}

export default setupS3Handler;