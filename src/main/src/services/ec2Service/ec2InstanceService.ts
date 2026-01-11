import {
  EC2Client,
  DescribeInstancesCommand,
  RunInstancesCommand,
  StopInstancesCommand,
  StartInstancesCommand,
  TerminateInstancesCommand,
  RebootInstancesCommand,
  _InstanceType,
  ResourceType
} from "@aws-sdk/client-ec2";

import { getStrictAwsRegion } from "@/config/aws.config.js";
import type { StrictCredentials } from "@/services/assumeRoleService.js";

type ValidInstanceType = (typeof _InstanceType)[keyof typeof _InstanceType];

const AMIMapping = {
  // Canonical, Ubuntu, 24.04, amd64 noble image
  Linux: "ami-02d26659fd82cf299",
  // Microsoft Windows Server 2025 Full Locale English
  Windows: "ami-066eb5725566530f0"
};

function createEC2Client(credential: StrictCredentials) {
  const region = getStrictAwsRegion();
  return new EC2Client({
    region,
    credentials: {
      accessKeyId: credential.AccessKeyId,
      secretAccessKey: credential.SecretAccessKey,
      sessionToken: credential.SessionToken
    }
  });
}

export async function listInstances(credential: StrictCredentials) {
  const client = createEC2Client(credential);

  const instances = await client.send(new DescribeInstancesCommand({}));
  return instances.Reservations?.flatMap((r) => r.Instances) || [];
}

export async function launchInstance(
  credential: StrictCredentials,
  instanceName: string,
  instanceImage: string = "Linux",
  instanceType: string = "t3.micro"
) {
  if (!(instanceImage in AMIMapping)) {
    throw new Error(
      `Instance image ${instanceImage} is not supported yet, 
      current supported version ${AMIMapping}`
    );
  }

  if (!(instanceType in _InstanceType)) {
    throw new Error(
      `Instance type ${instanceType} is not supported yet, 
      current supported version ${_InstanceType}`
    );
  }

  const client = createEC2Client(credential);

  const input = {
    ImageId: AMIMapping[instanceImage as keyof typeof AMIMapping],
    InstanceType: instanceType as ValidInstanceType,
    MaxCount: 1,
    MinCount: 1,

    TagSpecifications: [
      {
        ResourceType: "instance" as ResourceType,
        Tags: [{ Key: "Name", Value: instanceName }]
      }
    ]
  };

  const command = new RunInstancesCommand(input);
  const response = await client.send(command);
  return response;
}

export async function stopInstance(credential: StrictCredentials, instanceId: string) {
  const client = createEC2Client(credential);
  const command = new StopInstancesCommand({
    InstanceIds: [instanceId]
  });

  const response = await client.send(command);
  return response;
}

export async function startInstance(credential: StrictCredentials, instanceId: string) {
  const client = createEC2Client(credential);
  const command = new StartInstancesCommand({
    InstanceIds: [instanceId]
  });

  const response = await client.send(command);
  return response;
}

export async function terminateInstance(credential: StrictCredentials, instanceId: string) {
  const client = createEC2Client(credential);
  const command = new TerminateInstancesCommand({
    InstanceIds: [instanceId]
  });

  const response = await client.send(command);
  return response;
}

export async function restartInstance(credential: StrictCredentials, instanceId: string) {
  const client = createEC2Client(credential);
  const command = new RebootInstancesCommand({
    InstanceIds: [instanceId]
  });

  const response = await client.send(command);
  return response;
}
