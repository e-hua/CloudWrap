import {updateStaticSite, type UpdateStaticSiteInput} from "@/services/deploymentService/static-site/update.js";

async function main() {
  console.log("--- STARTING static site DEPLOYMENT ---");

  const updateTestInput: UpdateStaticSiteInput = {
    githubConnectionArn:
      "arn:aws:codestar-connections:us-east-2:276291856310:connection/e7b8cd7c-295f-4776-9f93-4356f180edd6",
    // The "new" branch name
    githubBranchName: "dev"
  };

  try {
    const logCallback = (elem: any) => console.log(elem.data);

    await updateStaticSite(1, updateTestInput, logCallback);

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
