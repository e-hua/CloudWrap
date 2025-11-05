import { assumeRole } from "@/services/assumeRoleService.js";
import { deployStaticSite } from "./deploy.js";
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

    githubRepoId: "e-hua/cloudwrap",
    githubBranchName: "dev",
    githubConnectionArn:
      "arn:aws:codestar-connections:us-east-2:276291856310:connection/5174afe0-6f89-4f52-a6c3-4ad911a7ab24",
    rootDirectory: "frontend",
    buildCommand: "npm run build",
    publishDirectory: "dist",
  };

  try {
    const logCallback = (elem: any) => console.log(elem.data);

    await deployStaticSite(testInputs, logCallback);
    const credential = await assumeRole();
    await manualDeploy(credential, testInputs.projectName);

    console.log("\n--- TEST DEPLOYMENT SUCCEEDED ---");
    console.log("Your ECS service is now running on an EC2 instance!");
    console.log(
      "Find the public URL in your CloudFront distribution list in the AWS console."
    );
  } catch (error) {
    console.error(error);
    console.error("\n--- TEST DEPLOYMENT FAILED ---");
  }
}

main();
