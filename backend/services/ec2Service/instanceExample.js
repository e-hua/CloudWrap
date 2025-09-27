import assumeRole from "../assumeRoleService.js";
import {
  launchInstance,
  listInstances,
  startInstance,
  stopInstance,
  terminateInstance,
} from "./ec2InstanceService.js";

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

const response = await terminateInstance(credential, "i-0fd01ddb654dbc76f");
console.log(response);
