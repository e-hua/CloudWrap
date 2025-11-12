import {createServer, type CreateServerInput} from "./create.js";
import {manualDeploy} from "@/services/deploymentService/pipelines/trigger-deployment.js";
import {assumeRole} from "@/services/assumeRoleService.js";

async function main() {
  console.log("--- STARTING ECS ON EC2 DEPLOYMENT ---");

  const testInputs : CreateServerInput = {
    githubConnectionArn:
      "arn:aws:codestar-connections:us-east-2:276291856310:connection/e7b8cd7c-295f-4776-9f93-4356f180edd6",

    projectName: `cloudwrap-ecs-test-node-app`,
    // This port number must match the port number we exposed in the Dockerfile
    githubRepoId: "e-hua/ECS-test-docker",
    githubBranchName: "main",
    rootDirectory: ".",

    container_port: 3030,
    instance_type: "t3.nano",
    dockerfile_path: "Dockerfile",
  };

  try {
    const logCallback = (elem: any) => console.log(elem.data);

    await createServer(testInputs, logCallback);
    const credentials = await assumeRole()
    await manualDeploy(credentials, `${testInputs.projectName}-pipeline`)
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
