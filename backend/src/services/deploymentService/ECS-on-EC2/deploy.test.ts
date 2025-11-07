import { deployECS } from "./deploy.js";

async function main() {
  console.log("--- STARTING ECS ON EC2 DEPLOYMENT ---");

  const testInputs = {
    projectName: `cloudwrap-ecs-test-node-app`,
    // This port number must match the port number we exposed in the Dockerfile
    container_port: 3030,
    instance_type: "t3.nano",

    githubRepoId: "e-hua/ECS-test-docker",
    githubBranchName: "main",
    githubConnectionArn:
      "arn:aws:codestar-connections:us-east-2:276291856310:connection/e7b8cd7c-295f-4776-9f93-4356f180edd6",
  };

  try {
    const logCallback = (elem: any) => console.log(elem.data);

    await deployECS(testInputs, logCallback);

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
