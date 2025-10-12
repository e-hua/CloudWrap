import assumeRole from "../assumeRoleService.js";
import { getCostAndUsage } from "../costService/costService.js";
import dotenv from "dotenv";

dotenv.config();

const testARN = process.env.USER_ROLE_ARN;
const credential = await assumeRole(testARN);

const result = await getCostAndUsage(credential, "MONTHLY", {
  recordTypes: ["Usage"],
  services: [
    "Amazon Elastic Compute Cloud - Compute",
    "Amazon Simple Storage Service",
  ],
});
console.log(JSON.stringify(result, null, 2));
