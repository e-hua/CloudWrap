import { deployECS } from "./deploy.js";

async function main() {
  console.log("--- STARTING ECS ON EC2 DEPLOYMENT ---");

  const testInputs = {
    projectName: `cloudwrap-ecs-test-nginx`,
    image_uri: "nginx:latest",
    container_port: 80,
    instance_type: "t3.nano",
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
