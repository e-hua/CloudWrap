import {deleteServer} from "@/services/deploymentService/ECS-on-EC2/delete.js";

async function main() {
  console.log("--- STARTING server DESTRUCTION ---");

  const githubConnectionArn = "arn:aws:codestar-connections:us-east-2:276291856310:connection/e7b8cd7c-295f-4776-9f93-4356f180edd6"

  try {
    const logCallback = (elem: any) => console.log(elem.data);

    await deleteServer(1, githubConnectionArn, logCallback);

    console.log("\n--- TEST DESTRUCTION SUCCEEDED ---");
  } catch (error) {
    console.error(error);
    console.error("\n--- TEST DESTRUCTION FAILED ---");
  }
}

main();
