import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { CustomAPI } from './types'
import { BuildingLogData, PipelineLogData } from '@/services/deploymentService/pipelines/logs'
import { StreamData } from '@/services/deploymentService/runTofu'

function createInternalListener<T>(channel: string, callback: (data: T) => void) {
  const listener = (_event: IpcRendererEvent, param: T) => { 
    callback(param)
  }
  ipcRenderer.on(channel, listener);
  console.log("event listener created")
  return () => {
    ipcRenderer.removeListener(channel, listener);
  }
}

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
  },
  services: {
    list: (filter) => ipcRenderer.invoke('services:list', filter),
    get: (id) => ipcRenderer.invoke('services:get', id),
    
    create: (payload) => ipcRenderer.invoke('services:stream-create', payload),
    update: (id, payload) => ipcRenderer.invoke('services:stream-update', { id, payload }),
    delete: (id, payload) => ipcRenderer.invoke('services:stream-delete', { id, payload }),

    onCreateLog: (callback) => createInternalListener<StreamData>('services-internal:create-log', callback),
    onUpdateLog: (id, callback) => createInternalListener<StreamData>(`services-internal:${id}-update-log`, callback),
    onDeleteLog: (id, callback) => createInternalListener<StreamData>(`services-internal:${id}-delete-log`, callback),
  },

  deploys: {
    list: (serviceId) => ipcRenderer.invoke('deploys:list', serviceId),
    trigger: (serviceId) => ipcRenderer.invoke('deploys:trigger', serviceId),

    streamStatuses: (serviceNumber, executionId) => 
      ipcRenderer.invoke('deploys:stream-statuses', { serviceNumber, executionId }),
    
    streamBuild: (buildId) => 
      ipcRenderer.invoke('deploys:stream-build', { buildId }),

    onStatusLog: (executionId, callback) => 
      createInternalListener<PipelineLogData>(`deploys-internal:execution-${executionId}`, callback),
      
    onBuildLog: (buildId, callback) => 
      createInternalListener<BuildingLogData>(`deploys-internal:build-${buildId}`, callback),
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
