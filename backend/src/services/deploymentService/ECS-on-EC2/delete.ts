import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { copy } from "fs-extra";
import path from "path";
import {
  STRICT_TF_STATE_BUCKET as state_bucket_name,
  STRICT_AWS_REGION as region,
  STRICT_TF_ROLE_ARN as tf_role_arn,
} from "@/config/aws.config.js";
import { getErrorMessage } from "@/utils/errors.js";
import {serviceCreator, serviceDeleter, serviceReader, serviceUpdater} from "@/db/index.js";

import { fileURLToPath } from "url";
import {runTofu, runTofuAndCollect, type StreamData} from "../runTofu.js";
import type {DBServerType, DBSiteInput, DBSiteType} from "@/db/queries/Services/Services.types.js";
import {manualDeploy} from "@/services/deploymentService/pipelines/trigger-deployment.js";
import {assumeRole} from "@/services/assumeRoleService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function deleteServer(
  service_id: number,
  githubConnectionArn: string,
  onStreamCallback: (data: StreamData) => void
): Promise<void> {
  const templatePath = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "templates",
    "opentofu",
    "server",
    "ECS-on-EC2"
  );

  const tempDir = await mkdtemp(path.join(tmpdir(), "cloudwrap-deployment-"));

  try {
    await copy(templatePath, tempDir);
    onStreamCallback({
      source: "sys-info",
      data: "Finished copying the template files",
    });

    onStreamCallback({
      source: "sys-info",
      data: "Start initializing the project",
    });

    const {readServiceById} = serviceReader;

    const oldServerService = readServiceById(service_id) as DBServerType | undefined

    if (!oldServerService || oldServerService.type !== 'server') {
      throw new Error(`Service with ID ${service_id} not found as server`)
    }

    const initArgs = [
      "init",
      "-reconfigure",
      `-backend-config=bucket=${state_bucket_name}`,
      `-backend-config=key=${oldServerService.name}/terraform.tfstate`,
      `-backend-config=region=${region}`,
    ];

    // Run tofu init command
    await runTofu({
      args: initArgs,
      dirPath: tempDir,
      onStream: onStreamCallback,
    });

    onStreamCallback({
      source: "sys-info",
      data: "Finished initializing the project!",
    });

    onStreamCallback({
      source: "sys-info",
      data: "Start applying modifications to the project, might take a couple of minutes",
    });

    const destroyArgs = [
      "destroy",
      "-auto-approve",
      `-var=aws_region=${oldServerService.region}`,
      `-var=project_name=${oldServerService.name}`,
      `-var=execution_role_arn=${tf_role_arn}`,
      `-var=container_port=${oldServerService.containerPort}`,
      `-var=secret_header_value=${oldServerService.secretHeaderValue}`,

      `-var=github_repo_id=${oldServerService.repoId}`,
      `-var=github_branch_name=${oldServerService.branchName}`,
      `-var=github_connection_arn=${githubConnectionArn}`,
      `-var=instance_type=${oldServerService.instanceType}`,
      `-var=root_directory=${oldServerService.rootDir}`,
      `-var=dockerfile_path=${oldServerService.dockerfilePath}`,
      // This is to prevent waiting indefinitely
      `-var=desired_count=0`,
    ];

    // Run tofu destroy command
    await runTofu({
      args: destroyArgs,
      dirPath: tempDir,
      onStream: onStreamCallback,
    });

    onStreamCallback({
      source: "sys-info",
      data: "Retrieving the service info and deleting them in the local database",
    });

    const {deleteServiceTransaction} = serviceDeleter;
    deleteServiceTransaction(service_id);
  } catch (err) {
    onStreamCallback({ source: "sys-failure", data: getErrorMessage(err) });
    throw err;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
    onStreamCallback({
      source: "sys-info",
      data: "Finished deleting the temporary deployment workspace",
    });
  }
}

export { deleteServer };
