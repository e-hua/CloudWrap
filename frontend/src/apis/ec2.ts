import { BACKEND_ENDPOINT_URL } from "@/config/constants";
import type { EC2_API_Instance } from "./ec2.types";

const ec2URL = `${BACKEND_ENDPOINT_URL}ec2/`;

async function fetchInstances() {
  try {
    const response = await fetch(`${ec2URL}instances/`, {
      method: "GET",
    });

    const result: EC2_API_Instance[] = await response.json();
    return result;
  } catch (error) {
    console.error(error);
  }
}

async function launchInstance(
  instanceName: string,
  instanceImage: string,
  instanceType: string
) {
  try {
    const response = await fetch(`${ec2URL}instances/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ instanceName, instanceImage, instanceType }),
    });

    const result = await response.json();
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}

async function deleteInstance(instanceId: string, ARN = "") {
  try {
    const response = await fetch(`${ec2URL}instances/${instanceId}`, {
      method: "DELETE",
      headers: {
        ARN,
      },
    });

    const result = await response.json();
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}

async function stopInstance(instanceId: string, ARN = "") {
  try {
    const response = await fetch(`${ec2URL}instances/${instanceId}/stop`, {
      method: "POST",
      headers: {
        ARN,
      },
    });

    const result = await response.json();
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}

async function startInstance(instanceId: string, ARN = "") {
  try {
    const response = await fetch(`${ec2URL}instances/${instanceId}/start`, {
      method: "POST",
      headers: {
        ARN,
      },
    });

    const result = await response.json();
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}

async function restartInstance(instanceId: string, ARN = "") {
  try {
    const response = await fetch(`${ec2URL}instances/${instanceId}/restart`, {
      method: "POST",
      headers: {
        ARN,
      },
    });

    const result = await response.json();
    console.log(result);
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
