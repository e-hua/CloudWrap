import { DBServiceQueryFilter } from '@/db/queries/Services/Services.schema';
import { DBServerType, DBServiceType, DBSiteType } from '@shared/services.types';
import { CreateServicePayload, DeleteServicePayload, UpdateServicePayload } from '@/services/deploymentService/deployment.schema';
import { BuildingLogData, PipelineLogData } from '@/services/deploymentService/pipelines/logs';
import { StreamData } from '@/services/deploymentService/runTofu';
import { PipelineExecutionSummary, StartPipelineExecutionCommandOutput } from '@aws-sdk/client-codepipeline';
import { Granularity, ResultByTime } from '@aws-sdk/client-cost-explorer';
import { _Object, Bucket } from '@aws-sdk/client-s3'
import { EC2_API_Instance } from '@shared/ec2.type';
import type { AppConfig, AppSecrets } from '@shared/onboarding.type';

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
  },
  services: {
    list: (filter: DBServiceQueryFilter) => Promise<IPCDataResponse<DBServiceType[]>>;
    get: (serviceNumber: number) => Promise<IPCDataResponse<DBServerType | DBSiteType>>;
    
    create: (payload: CreateServicePayload) => Promise<void>;
    update: (id: string, payload: UpdateServicePayload) => Promise<void>;
    delete: (id: string, payload: DeleteServicePayload) => Promise<void>;

    // These are the APIs to register a callback to listen the events in the main process 
    // Returning cleanup functions 
    onCreateLog: (callback: (data: StreamData) => void) => () => void;
    onUpdateLog: (id: string, callback: (data: StreamData) => void) => () => void;
    onDeleteLog: (id: string, callback: (data: StreamData) => void) => () => void;
  };
  deploys: {
    list: (serviceId: string) => Promise<IPCDataResponse<PipelineExecutionSummary[]>>;
    trigger: (serviceId: string) => Promise<IPCDataResponse<StartPipelineExecutionCommandOutput>>;
    
    streamStatuses: (serviceNumber: string, executionId: string) => Promise<void>;
    streamBuild: (buildId: string) => Promise<void>;

    // These are the APIs to register a callback to listen the events in the main process 
    // Returning cleanup functions 
    onStatusLog: (executionId: string, callback: (data: PipelineLogData) => void) => () => void;
    onBuildLog: (buildId: string, callback: (data: BuildingLogData) => void) => () => void;
  };

  onboarding: {
    start: (credentials: { accessKey: string; secretKey: string; region: string }) => Promise<IPCSuccessResponse<void>>;
    onLog: (callback: (data: StreamData) => void) => () => void;
    configs: () => Promise<IPCDataResponse<AppConfig & Partial<AppSecrets>>>;
  }
}