import assumeRole from "../assumeRoleService.js";
import {
  launchInstance,
  listInstances,
  startInstance,
  stopInstance,
  terminateInstance,
} from "../ec2Service/ec2InstanceService.js";
import dotenv from "dotenv";
dotenv.config();

const testARN = process.env.USER_ROLE_ARN;

const credential = await assumeRole(testARN);

/*
const launchResponse = await launchInstance(
  credential,
  "test",
  undefined,
  undefined
);
console.log(launchResponse);

const instances = await listInstances(credential);
console.log(instances);
*/
