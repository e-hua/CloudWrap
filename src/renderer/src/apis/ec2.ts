import { EC2_API_Instance } from "@shared/ec2.type";

async function fetchInstances(): Promise<EC2_API_Instance[] | undefined> {
  try {
    const response = await window.api.ec2.listInstances();
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error)
    }
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

async function launchInstance(
  instanceName: string,
  instanceImage: string,
  instanceType: string
) {
  try {
    const response = await window.api.ec2.addInstance(instanceName, instanceImage, instanceType);
    if (response.success) {
      console.log(response.message)
    } else {
      throw new Error(response.error)
    }
  } catch (error) {
    console.error(error);
  }
}

async function deleteInstance(instanceId: string) {
  try {
    const response = await window.api.ec2.deleteInstance(instanceId);
    if (response.success) {
      console.log(response.message)
    } else {
      throw new Error(response.error)
    }
  } catch (error) {
    console.error(error);
  }
}

async function stopInstance(instanceId: string) {
  try {
    const response = await window.api.ec2.stopInstance(instanceId);
    if (response.success) {
      console.log(response.message)
    } else {
      throw new Error(response.error)
    }
  } catch (error) {
    console.error(error);
  }
}

async function startInstance(instanceId: string) {
  try {
    const response = await window.api.ec2.startInstance(instanceId);
    if (response.success) {
      console.log(response.message)
    } else {
      throw new Error(response.error)
    }
  } catch (error) {
    console.error(error);
  }
}

async function restartInstance(instanceId: string) {
  try {
    const response = await window.api.ec2.restartInstance(instanceId);
    if (response.success) {
      console.log(response.message)
    } else {
      throw new Error(response.error)
    }
  } catch (error) {
    console.error(error);
  }
}

export {
  fetchInstances,
  launchInstance,
  deleteInstance,
  stopInstance,
  startInstance,
  restartInstance,
};
