import {
  updateServer,
  type UpdateServerDeps,
  type UpdateServerInput, type UpdateServerInputs
} from "@/services/deploymentService/ECS-on-EC2/update.js";
import {serviceReader, serviceUpdater} from "@/db/index.js";
import {runTofu, runTofuAndCollect} from "@/services/deploymentService/runTofu.js";
import {mkdtemp, rm} from "fs/promises";
import {copy} from "fs-extra";
import {tmpdir} from "os";
import {manualDeploy} from "@/services/deploymentService/pipelines/trigger-deployment.js";
import {assumeRole} from "@/services/assumeRoleService.js";

const updateTestDeps: UpdateServerDeps = {
  serviceUpdater,
  serviceReader,
  runTofu,
  runTofuAndCollect,
  mkdtemp,
  copy,
  rm,
  tmpdir,
  manualDeploy,
  assumeRole
}

const updateTestInput: UpdateServerInput = {
  githubConnectionArn:
    "arn:aws:codestar-connections:us-east-2:276291856310:connection/e7b8cd7c-295f-4776-9f93-4356f180edd6",
  dockerfile_path: "./Dockerfile"
};

const logCallback = (elem: any) => console.log(elem.data);

const updateTestInputs: UpdateServerInputs = {
  service_id: 1,
  inputs: updateTestInput,
  onStreamCallback: logCallback
}


async function main() {
  console.log("--- STARTING static site DEPLOYMENT ---");

  try {
    await updateServer(updateTestInputs, updateTestDeps);

    console.log("\n--- TEST DEPLOYMENT SUCCEEDED ---");
    console.log(
      "Find the public URL in your CloudFront distribution list in the AWS console."
    );
  } catch (error) {
    console.error(error);
    console.error("\n--- TEST DEPLOYMENT FAILED ---");
  }
}

main();
