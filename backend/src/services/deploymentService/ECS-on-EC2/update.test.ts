import {updateServer, type UpdateServerInput} from "@/services/deploymentService/ECS-on-EC2/update.js";

async function main() {
  console.log("--- STARTING static site DEPLOYMENT ---");

  const updateServerInput: UpdateServerInput = {
    githubConnectionArn:
      "arn:aws:codestar-connections:us-east-2:276291856310:connection/e7b8cd7c-295f-4776-9f93-4356f180edd6",
    dockerfile_path: "./Dockerfile"
  };

  try {
    const logCallback = (elem: any) => console.log(elem.data);

    await updateServer(1, updateServerInput, logCallback);

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
