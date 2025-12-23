import setupBillHandler from "./bill";
import setupEC2Handler from "./ec2";
import setupS3Handler from "./s3";

function setupIPCHandlers() {
  setupS3Handler();
  setupEC2Handler();
  setupBillHandler();
}

export {setupIPCHandlers};