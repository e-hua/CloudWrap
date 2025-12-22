import {deleteServer, type DeleteServerDeps} from "@/services/deploymentService/ECS-on-EC2/delete.js";
import type {DeleteStaticSiteDeps} from "@/services/deploymentService/static-site/delete.js";
import {serviceDeleter, serviceReader} from "@/db/index.js";
import {runTofu} from "@/services/deploymentService/runTofu.js";
import {mkdtemp, rm} from "fs/promises";
import {copy} from "fs-extra";
import {tmpdir} from "os";

const deleteServiceDeps: DeleteServerDeps = {
  serviceReader,
  serviceDeleter,
  runTofu,
  mkdtemp,
  copy,
  rm,
  tmpdir
}

async function main() {
  console.log("--- STARTING server DESTRUCTION ---");

  const githubConnectionArn = "arn:aws:codestar-connections:us-east-2:276291856310:connection/e7b8cd7c-295f-4776-9f93-4356f180edd6"

  try {
    const logCallback = (elem: any) => console.log(elem.data);

    await deleteServer({
        service_id: 1,
        githubConnectionArn,
        onStreamCallback: logCallback
      },
      deleteServiceDeps)

    console.log("\n--- TEST DESTRUCTION SUCCEEDED ---");
  } catch (error) {
    console.error(error);
    console.error("\n--- TEST DESTRUCTION FAILED ---");
  }
}

main();
