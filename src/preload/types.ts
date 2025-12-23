import { Granularity, ResultByTime } from '@aws-sdk/client-cost-explorer';
import { _Object, Bucket } from '@aws-sdk/client-s3'
import { EC2_API_Instance } from '@shared/ec2.type';

export type IPCSuccessResponse<T> = {
  success: true;
  data: T; 
}

export type IPCSuccessMessageResponse = {
  success: true;
  message: string;
}

export type IPCFailResponse = {
  success: false;
  error: string;
}

export type IPCDataResponse<T> = IPCSuccessResponse<T> | IPCFailResponse;
export type IPCMessageResponse = IPCSuccessMessageResponse | IPCFailResponse;

export type CustomAPI = {
  s3: {
    listBuckets: () => Promise<IPCDataResponse<Bucket[] | undefined>>,
    addBucket: (bucketName: string) => Promise<IPCMessageResponse>,
    deleteBucket: (bucketName: string) => Promise<IPCMessageResponse>,
    listObjects: (bucketName: string) => Promise<IPCDataResponse<_Object[] | undefined>>,
    uploadObject: (bucketName: string, objectName: string, buffer: ArrayBuffer, mimeType: string) => Promise<IPCMessageResponse>,
    deleteObject: (bucketName: string, objectName: string) => Promise<IPCMessageResponse>,
    getObject: (bucketName: string, objectName: string) => Promise<IPCDataResponse<{file: Uint8Array<ArrayBufferLike>, type: string | undefined}>>,
  },
  ec2: {
    listInstances: () => Promise<IPCDataResponse<EC2_API_Instance[]>>,
    addInstance: (name: string, image: string, type: string) => Promise<IPCMessageResponse>,
    deleteInstance: (id: string) => Promise<IPCMessageResponse>,
    stopInstance: (id: string) => Promise<IPCMessageResponse>,
    startInstance: (id: string) => Promise<IPCMessageResponse>,
    restartInstance: (id: string) => Promise<IPCMessageResponse>,
  },
  bill: {
    getCost: (filter: {granularity: Granularity, recordTypes: string}) => Promise<IPCDataResponse<ResultByTime[]>>
  }
}