import setupBillHandler from "./bill";
import setupDeployHandler from "./deploys";
import setupEC2Handler from "./ec2";
import setupOnboardingHandler from "./onboarding";
import setupS3Handler from "./s3";
import setupServiceHandler from "./service";

function setupIPCHandlers() {
  setupS3Handler();
  setupEC2Handler();
  setupBillHandler();
  setupServiceHandler();
  setupDeployHandler();
  setupOnboardingHandler();
}

export {setupIPCHandlers};