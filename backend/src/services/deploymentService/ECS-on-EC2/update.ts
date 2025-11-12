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
import {serviceCreator, serviceReader, serviceUpdater} from "@/db/index.js";

import { fileURLToPath } from "url";
import {runTofu, runTofuAndCollect, type StreamData} from "../runTofu.js";
import type {DBServerInput, DBServerType, DBSiteInput, DBSiteType} from "@/db/queries/Services/Services.types.js";
import {manualDeploy} from "@/services/deploymentService/pipelines/trigger-deployment.js";
import {assumeRole} from "@/services/assumeRoleService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import type {UpdateServerInput} from "@/services/deploymentService/deployment.schema.js";

async function updateServer(
  service_id: number,
  inputs: UpdateServerInput,
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

  // Using temporary folder to carry out the deployment
  // E.g. final directory path: '/tmp/cloudwrap-deployment-aB1xZ2'
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

    const updateServerInput: Omit<DBServerInput, "type" | "name"> = {
      group_id: inputs.groupId || oldServerService.group_id,
      region: oldServerService.region,
      repoId: inputs.githubRepoId || oldServerService.repoId,
      branchName: inputs.githubBranchName || oldServerService.branchName,
      rootDir: inputs.rootDirectory || oldServerService.rootDir,
      cloudFrontDomainName: oldServerService.cloudFrontDomainName,

      containerPort: inputs.container_port || oldServerService.containerPort,
      instanceType: inputs.instance_type || oldServerService.instanceType,
      dockerfilePath: inputs.dockerfile_path || oldServerService.dockerfilePath,
      secretHeaderValue: oldServerService.secretHeaderValue
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

    const applyArgs = [
      "apply",
      "-auto-approve",
      `-var=github_connection_arn=${inputs.githubConnectionArn}`,

      `-var=aws_region=${region}`,
      `-var=project_name=${oldServerService.name}`,
      `-var=execution_role_arn=${tf_role_arn}`,
      `-var=github_repo_id=${updateServerInput.repoId}`,
      `-var=github_branch_name=${updateServerInput.branchName}`,
      `-var=root_directory=${updateServerInput.rootDir}`,

      `-var=container_port=${updateServerInput.containerPort}`,
      `-var=instance_type=${updateServerInput.instanceType}`,
      `-var=dockerfile_path=${updateServerInput.dockerfilePath}`,
      `-var=secret_header_value=${updateServerInput.secretHeaderValue}`,
    ];

    // Run tofu apply command
    await runTofu({
      args: applyArgs,
      dirPath: tempDir,
      onStream: onStreamCallback,
    });

    onStreamCallback({
      source: "sys-info",
      data: "Retrieving the service info and updating them in the local database",
    });

    const collectArgs = ['output', '-json']

    const jsonOutputs = await runTofuAndCollect({args: collectArgs, dirPath: tempDir})
    const outputs = JSON.parse(jsonOutputs)

    const {updateServerTransaction} = serviceUpdater;
    updateServerInput.cloudFrontDomainName = outputs.application_url.value
    updateServerTransaction(service_id, updateServerInput);

    const credential = await assumeRole();
    await manualDeploy(credential, `${oldServerService.name}-pipeline`)
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

export { updateServer };
export type { UpdateServerInput };
