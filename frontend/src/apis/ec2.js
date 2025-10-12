import { BACKEND_ENDPOINT_URL } from "../config/constants";

const ec2URL = `${BACKEND_ENDPOINT_URL}ec2/`;

async function fetchInstances(ARN = "") {
  try {
    const response = await fetch(`${ec2URL}instances/`, {
      method: "GET",
      headers: {
        ARN,
      },
    });

    const result = response.json();
    return result;
  } catch (error) {
    console.error(error);
  }
}

async function launchInstance(
  instanceName,
  instanceImage,
  instanceType,
  ARN = ""
) {
  try {
    const response = await fetch(`${ec2URL}instances/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ARN,
      },
      body: JSON.stringify({ instanceName, instanceImage, instanceType }),
    });

    const result = response.json();
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}

async function deleteInstance(instanceId, ARN = "") {
  try {
    const response = await fetch(`${ec2URL}instances/${instanceId}`, {
      method: "DELETE",
      headers: {
        ARN,
      },
    });

    const result = response.json();
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}

async function stopInstance(instanceId, ARN = "") {
  try {
    const response = await fetch(`${ec2URL}instances/${instanceId}/stop`, {
      method: "POST",
      headers: {
        ARN,
      },
    });

    const result = response.json();
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}

async function startInstance(instanceId, ARN = "") {
  try {
    const response = await fetch(`${ec2URL}instances/${instanceId}/start`, {
      method: "POST",
      headers: {
        ARN,
      },
    });

    const result = response.json();
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}

async function restartInstance(instanceId, ARN = "") {
  try {
    const response = await fetch(`${ec2URL}instances/${instanceId}/restart`, {
      method: "POST",
      headers: {
        ARN,
      },
    });

    const result = response.json();
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
