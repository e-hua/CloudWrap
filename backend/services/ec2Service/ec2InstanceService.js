import {
  EC2Client,
  DescribeInstancesCommand,
  RunInstancesCommand,
  StopInstancesCommand,
  StartInstancesCommand,
  TerminateInstancesCommand,
  RebootInstancesCommand,
} from "@aws-sdk/client-ec2";

const region = process.env.AWS_REGION;

const AMIMapping = {
  // Canonical, Ubuntu, 24.04, amd64 noble image
  Linux: "ami-02d26659fd82cf299",
  // Microsoft Windows Server 2025 Full Locale English
  Windows: "ami-066eb5725566530f0",
};

function createEC2Client(credential) {
  return new EC2Client({
    region: region,
    credentials: {
      accessKeyId: credential.AccessKeyId,
      secretAccessKey: credential.SecretAccessKey,
      sessionToken: credential.SessionToken,
    },
  });
}

export async function listInstances(credential) {
  const client = createEC2Client(credential);

  const instances = await client.send(new DescribeInstancesCommand({}));
  return instances.Reservations?.flatMap((r) => r.Instances) || [];
}

export async function launchInstance(
  credential,
  instanceName,
  instanceImage = "Linux",
  instanceType = "t3.micro"
) {
  const client = createEC2Client(credential);

  const input = {
    ImageId: AMIMapping[instanceImage],
    InstanceType: instanceType,
    MaxCount: 1,
    MinCount: 1,

    TagSpecifications: [
      {
        ResourceType: "instance",
        Tags: [{ Key: "Name", Value: instanceName }],
      },
    ],
  };

  const command = new RunInstancesCommand(input);
  const response = await client.send(command);
  return response;
}

export async function stopInstance(credential, instanceId) {
  const client = createEC2Client(credential);
  const command = new StopInstancesCommand({
    InstanceIds: [instanceId],
  });

  const response = await client.send(command);
  return response;
}

export async function startInstance(credential, instanceId) {
  const client = createEC2Client(credential);
  const command = new StartInstancesCommand({
    InstanceIds: [instanceId],
  });

  const response = await client.send(command);
  return response;
}

export async function terminateInstance(credential, instanceId) {
  const client = createEC2Client(credential);
  const command = new TerminateInstancesCommand({
    InstanceIds: [instanceId],
  });

  const response = await client.send(command);
  return response;
}

export async function restartInstance(credential, instanceId) {
  const client = createEC2Client(credential);
  const command = new RebootInstancesCommand({
    InstanceIds: [instanceId],
  });

  const response = await client.send(command);
  return response;
}
