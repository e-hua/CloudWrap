import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import { StreamData } from "../deploymentService/runTofu";
import { HeadBucketCommand, S3Client, S3ServiceException } from "@aws-sdk/client-s3";
import { Capability, CloudFormationClient, CreateStackCommand, DescribeStackEventsCommand, DescribeStacksCommand, Stack, StackStatus, UpdateStackCommand } from "@aws-sdk/client-cloudformation";
import { templateDirPath } from "../deploymentService/pathConfig";
import path from "path";
import fs from "fs-extra"
import { sleep } from "@/utils/sleep";
import { ConfigManager } from "@/utils/ConfigManager";

const TARGET_BUCKET = "tf-state-cloudwrap";
const BOOTSTRAP_CONFIG_FILENAME = "Bootstrap.json";

type OnboardingParams = {
  accessKey: string;
  secretKey: string;
  region: string;
  onLog: (elem: StreamData) => void
}

const checkBucketExists = async (s3: S3Client, bucketName: string) => {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
    return true;
  } catch (error) {
    if (error instanceof S3ServiceException) {
      // Return fasle if the status code is 404 not found
      if (error.$metadata.httpStatusCode === 404) {
        return false;
      }
      // pass the buck in other case
      throw error;
    }
    throw error;
  }
};

const TERMINAL_STATUSES: StackStatus[] = [
  StackStatus.CREATE_COMPLETE,
  StackStatus.CREATE_FAILED,
  StackStatus.ROLLBACK_COMPLETE,
  StackStatus.ROLLBACK_FAILED,
  StackStatus.UPDATE_COMPLETE,       
  StackStatus.UPDATE_ROLLBACK_COMPLETE,
  StackStatus.UPDATE_ROLLBACK_FAILED
];

async function monitorCloudFormationStack (
  cloudFormationClient: CloudFormationClient,
  stackName: string,
  onLog: (elem: StreamData) => void
): Promise<Stack | undefined> {
  let isComplete = false;
  const existingEventIds = new Set<string>()

  while(!isComplete) {
    const [stackResponse, eventsResponse] = await Promise.all([
      cloudFormationClient.send(new DescribeStacksCommand({StackName: stackName})),
      cloudFormationClient.send(new DescribeStackEventsCommand({ StackName: stackName }))
    ]);

    const stacks = stackResponse.Stacks;
    const stackEvents = eventsResponse.StackEvents || [];

    if (!stacks || stacks?.length === 0) {
      await sleep(3000);
      continue;
    }

    const status = stacks?.[0]?.StackStatus;
    // Sort the new events from oldest to newest
    const newEvents = stackEvents
      .filter(event => event.EventId && !existingEventIds.has(event.EventId))
      .sort((a, b) => (a.Timestamp?.getTime() || 0) - (b.Timestamp?.getTime() || 0))

    for (const event of newEvents) {
      if (event.EventId) {
        existingEventIds.add(event.EventId)
      }

      onLog({
        source: "stdout",
        data: `${event.ResourceStatus} ${event.LogicalResourceId} ${event.ResourceType}`
      })
      
      if (event.ResourceStatusReason) {
        onLog({
          source: "stdout",
          data: `└─ ${event.ResourceStatusReason}`
        })
      }
    }

    if (status && TERMINAL_STATUSES.includes(status)) {
      isComplete = true;
      if (status === StackStatus.CREATE_FAILED) {
        throw new Error(`Stack finished with status: ${status}`, )
      }
      return stacks?.[0];
    } else {
      await sleep(3000);
    }
  }

  return undefined
}

async function startOnboarding({accessKey, secretKey, region, onLog}: OnboardingParams) {
  const credentials = { accessKeyId: accessKey, secretAccessKey: secretKey };
  const cloudFormationClient = new CloudFormationClient({ region, credentials });
  const s3Client = new S3Client({ region, credentials });
  const stsClient = new STSClient({ region, credentials }); 

  onLog({ source: 'sys-info', data: 'Authenticating...' }); 
  const identity = await stsClient.send(new GetCallerIdentityCommand({}));
  onLog({ source: 'sys-info', data: 'Authenticated' }); 

  const uniqueBucketName = `${TARGET_BUCKET}-${identity.Account}` 
  const bucketExists = await checkBucketExists(s3Client, uniqueBucketName );
  if (bucketExists) {
    onLog({source: 'sys-info', data: `Found existing bucket: ${uniqueBucketName} `});
  }

  const templatePath = path.join(templateDirPath, BOOTSTRAP_CONFIG_FILENAME);
  const templateBody = await fs.readFile(templatePath, 'utf-8');
  const stackName = 'CloudWrap-Bootstrap-Stack';
  const params = [
    // Need to make the name of the bucket unique across different accounts
    { ParameterKey: 'TargetBucketName', ParameterValue: uniqueBucketName },
    { ParameterKey: 'BootstrapUserArn', ParameterValue: identity.Arn },
    { ParameterKey: 'CreateNewBucket', ParameterValue: bucketExists ? 'No' : 'Yes' },
    { ParameterKey: 'ExistingBucketName', ParameterValue: bucketExists ? uniqueBucketName : '' }
  ];

  const stackInput = {
    StackName: stackName,
    TemplateBody: templateBody,
    Capabilities: [Capability.CAPABILITY_NAMED_IAM],
    Parameters: params
  }

  onLog({ source: 'sys-info', data: 'Running CloudFormation template...' });
  try {
    await cloudFormationClient.send(new CreateStackCommand(stackInput));
  } catch (error) {
    console.error("Create stack error: ", error)
    await cloudFormationClient.send(new UpdateStackCommand(stackInput));
  }

  const stack = await monitorCloudFormationStack(cloudFormationClient, stackName, onLog)

  onLog({ source: 'sys-info', data: 'Saving configurations...' });

  const bucket = stack?.Outputs?.find(o => o.OutputKey === 'BucketName')?.OutputValue;
  const tfRoleArn = stack?.Outputs?.find(o => o.OutputKey === 'TfRoleArn')?.OutputValue;
  const serviceRoleArn = stack?.Outputs?.find(o => o.OutputKey === 'ServiceRoleArn')?.OutputValue;

  if (!bucket || !tfRoleArn || !serviceRoleArn) {
    throw new Error("Stack completed but returned missing outputs.");
  } 

  ConfigManager.saveSecrets(accessKey, secretKey);
  ConfigManager.saveConfig({
    awsRegion: region,
    tfStateBucket: bucket,
    tfRoleARN: tfRoleArn,
    roleARN: serviceRoleArn,
    isOnboarded: true
  });

  onLog({ source: 'sys-info', data: 'Configurations saved' })
}

export {startOnboarding}