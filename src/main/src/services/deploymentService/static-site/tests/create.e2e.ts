import {createStaticSite, type CreateStaticSiteDeps, type CreateStaticSiteInput} from "../create.js";
import {serviceCreator} from "@/db/index.js";
import {runTofu, runTofuAndCollect} from "@/services/deploymentService/runTofu.js";
import {mkdtemp, rm} from "fs/promises";
import {copy} from "fs-extra";
import {tmpdir} from "os";

async function main() {
  console.log("--- STARTING static site DEPLOYMENT ---");

  const testInputs: CreateStaticSiteInput = {
    projectName: "demo-static-site",

    githubRepoId: "e-hua/CloudWrap",
    githubBranchName: "dev",
    githubConnectionArn:
      "arn:aws:codestar-connections:us-east-2:276291856310:connection/e7b8cd7c-295f-4776-9f93-4356f180edd6",
    rootDirectory: "frontend",
    buildCommand: "npm run build",
    publishDirectory: "dist",
  };


  const createServiceDeps: CreateStaticSiteDeps = {
    serviceCreator,
    runTofu,
    runTofuAndCollect,
    mkdtemp,
    copy,
    rm,
    tmpdir
  }

  try {
    const logCallback = (elem: any) => console.log(elem.data);

    await createStaticSite({inputs: testInputs, onStreamCallback: logCallback}, createServiceDeps);

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