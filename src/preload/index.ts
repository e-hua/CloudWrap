import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { CustomAPI } from './types'

// Custom APIs for renderer
const api: CustomAPI = {
  s3: {
    listBuckets: () => ipcRenderer.invoke("s3:list-buckets"),
    addBucket: (bucketName: string) => ipcRenderer.invoke("s3:add-bucket", bucketName),
    deleteBucket: (bucketName: string) => ipcRenderer.invoke("s3:delete-bucket", bucketName),
    listObjects: (bucketName: string) => ipcRenderer.invoke("s3:list-objects", bucketName),
    uploadObject: (bucketName: string, objectName: string, buffer: ArrayBuffer, mimeType: string) => 
      ipcRenderer.invoke("s3:upload-object", {bucketName, objectName, buffer, mimeType}),
    deleteObject: (bucketName: string, objectName: string) => ipcRenderer.invoke("s3:delete-object", {bucketName, objectName}),
    getObject: (bucketName: string, objectName: string) => ipcRenderer.invoke("s3:get-object", {bucketName, objectName}),
  },
  ec2: {
    listInstances: () => ipcRenderer.invoke('ec2:list-instances'),
    addInstance: (instanceName, instanceImage, instanceType) => 
      ipcRenderer.invoke('ec2:add-instance', { instanceName, instanceImage, instanceType }),
    deleteInstance: (id) => ipcRenderer.invoke('ec2:delete-instance', id),
    stopInstance: (id) => ipcRenderer.invoke('ec2:stop-instance', id),
    startInstance: (id) => ipcRenderer.invoke('ec2:start-instance', id),
    restartInstance: (id) => ipcRenderer.invoke('ec2:restart-instance', id),
  },
  bill: {
    getCost: (filter) => ipcRenderer.invoke('bill:get-cost', filter)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
