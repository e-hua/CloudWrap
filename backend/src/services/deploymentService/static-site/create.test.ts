import { assumeRole } from "@/services/assumeRoleService.js";
import { createStaticSite } from "./create.js";
import { manualDeploy } from "./trigger-deployment.js";

async function main() {
  console.log("--- STARTING static site DEPLOYMENT ---");

  /*
  const credential = await assumeRole();
  const response = await createGithubConnection(credential);
  console.log(response);

  */
  const testInputs = {
    projectName: "demo-static-site",
    siteBucketName: "demon-static-site-bucket",

    githubRepoId: "e-hua/CloudWrap",
    githubBranchName: "dev",
    githubConnectionArn:
      "arn:aws:codestar-connections:us-east-2:276291856310:connection/e7b8cd7c-295f-4776-9f93-4356f180edd6",
    rootDirectory: "frontend",
    buildCommand: "npm run build",
    publishDirectory: "dist",
  };

  try {
    const logCallback = (elem: any) => console.log(elem.data);

    await createStaticSite(testInputs, logCallback);
    // Manually trigger works
    // const credential = await assumeRole();
    // await manualDeploy(credential, testInputs.projectName);

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
