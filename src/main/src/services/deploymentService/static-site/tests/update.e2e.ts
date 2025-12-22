import {
  updateStaticSite, type UpdateStaticSiteDeps,
  type UpdateStaticSiteInput,
  type UpdateStaticSiteInputs
} from "@/services/deploymentService/static-site/update.js";
import {serviceReader, serviceUpdater} from "@/db/index.js";
import {runTofu, runTofuAndCollect} from "@/services/deploymentService/runTofu.js";
import {mkdtemp, rm} from "fs/promises";
import {copy} from "fs-extra";
import {tmpdir} from "os";
import {assumeRole} from "@/services/assumeRoleService.js";
import {manualDeploy} from "@/services/deploymentService/pipelines/trigger-deployment.js";
import type {UpdateServerInputs} from "@/services/deploymentService/ECS-on-EC2/update.js";

async function main() {
  console.log("--- STARTING static site DEPLOYMENT ---");

  const updateTestInput: UpdateStaticSiteInput = {
    githubConnectionArn:
      "arn:aws:codestar-connections:us-east-2:276291856310:connection/e7b8cd7c-295f-4776-9f93-4356f180edd6",
    // The "new" branch name
    githubBranchName: "dev"
  };

  const logCallback = (elem: any) => console.log(elem.data);

  const updateTestInputs: UpdateServerInputs = {
    service_id: 1,
    inputs: updateTestInput,
    onStreamCallback: logCallback
  }

  const updateTestDeps: UpdateStaticSiteDeps = {
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

  try {

    await updateStaticSite(updateTestInputs, updateTestDeps);

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
