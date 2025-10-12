import express from "express";

import assumeRole from "../services/assumeRoleService.js";

import {
  listInstances,
  launchInstance,
  stopInstance,
  startInstance,
  terminateInstance,
  restartInstance,
} from "../services/ec2Service/ec2InstanceService.js";

function parseInstanceList(instances) {
  return instances.map((instance) => {
    const {
      InstanceId,
      InstanceType,
      State,
      Placement,
      PublicDnsName,
      PublicIpAddress,
      Monitoring,
      SecurityGroups = [],
      KeyName,
      LaunchTime,
      PlatformDetails,
      Operator,
      NetworkInterfaces = [],
      Tags = [],
    } = instance;

    return {
      Name: Tags.find((entry) => entry.Key === "Name")?.Value,
      InstanceId,
      InstanceState: State?.Name,
      InstanceType,
      AvailabilityZone: Placement?.AvailabilityZone,
      Dns: PublicDnsName,
      Ipv4: PublicIpAddress,
      Ipv6: NetworkInterfaces.flatMap((entry) => entry.Ipv6Addresses),
      Monitoring: Monitoring.State,
      SecurityGroups: SecurityGroups.map((elem) => elem.GroupName),
      KeyName: KeyName,
      LaunchTime: LaunchTime,
      Platform: PlatformDetails,
      Managed: Operator.Managed,
    };
  });
}
const router = express.Router();

router.get("/instances", async (req, res) => {
  try {
    const ARN = req.headers.ARN || process.env.USER_ROLE_ARN;
    const credential = await assumeRole(ARN);

    const instances = await listInstances(credential);

    res.status(200).send(parseInstanceList(instances));
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// Launch instance
router.post("/instances", async (req, res) => {
  try {
    const ARN = req.headers.ARN || process.env.USER_ROLE_ARN;
    const { instanceName, instanceImage, instanceType } = req.body;
    const credential = await assumeRole(ARN);

    await launchInstance(credential, instanceName, instanceImage, instanceType);
    res.status(201).send({ message: "Instance launched successfully" });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// Terminate instance
router.delete("/instances/:id", async (req, res) => {
  try {
    const ARN = req.headers.ARN || process.env.USER_ROLE_ARN;
    const { id } = req.params;

    const credential = await assumeRole(ARN);
    await terminateInstance(credential, id);

    res.status(204).send({ message: "Instance deleted successfully" });
  } catch (err) {
    res.status(500).send({ err: err.message });
  }
});

// Stop instance
router.post("/instances/:id/stop", async (req, res) => {
  try {
    const ARN = req.headers.ARN || process.env.USER_ROLE_ARN;
    const { id } = req.params;

    const credential = await assumeRole(ARN);
    await stopInstance(credential, id);

    res.status(202).send({ message: "Instance stopped successfully" });
  } catch (err) {
    res.status(500).send({ err: err.message });
  }
});

// Start instance
router.post("/instances/:id/start", async (req, res) => {
  try {
    const ARN = req.headers.ARN || process.env.USER_ROLE_ARN;
    const { id } = req.params;

    const credential = await assumeRole(ARN);
    await startInstance(credential, id);

    res.status(202).send({ message: "Instance started successfully" });
  } catch (err) {
    res.status(500).send({ err: err.message });
  }
});

// Restart instance
router.post("/instances/:id/restart", async (req, res) => {
  try {
    const ARN = req.headers.ARN || process.env.USER_ROLE_ARN;
    const { id } = req.params;

    const credential = await assumeRole(ARN);
    await restartInstance(credential, id);

    res.status(202).send({ message: "Instance restarted successfully" });
  } catch (err) {
    res.status(500).send({ err: err.message });
  }
});

export default router;
