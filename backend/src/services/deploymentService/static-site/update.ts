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
import type {DBSiteInput, DBSiteType} from "@/db/queries/Services/Services.types.js";
import {manualDeploy} from "@/services/deploymentService/pipelines/trigger-deployment.js";
import {assumeRole} from "@/services/assumeRoleService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import type {UpdateStaticSiteInput} from "@/services/deploymentService/deployment.schema.js";

async function updateStaticSite(
  service_id: number,
  inputs: UpdateStaticSiteInput,
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
    "static-site"
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

    const oldSiteService = readServiceById(service_id) as DBSiteType | undefined

    if (!oldSiteService || oldSiteService.type !== 'static-site') {
      throw new Error(`Service with ID ${service_id} not found as static-site`)
    }

    const updateSiteInput: Omit<DBSiteInput, "type" | "name"> = {
      group_id: inputs.groupId || oldSiteService.group_id,
      region: oldSiteService.region,
      repoId: inputs.githubRepoId || oldSiteService.repoId,
      branchName: inputs.githubBranchName || oldSiteService.branchName,
      rootDir: inputs.rootDirectory || oldSiteService.rootDir,
      // need to update it after done applying
      cloudFrontDomainName: oldSiteService.cloudFrontDomainName,
      buildCommand: inputs.buildCommand || oldSiteService.buildCommand,
      publishDirectory: inputs.publishDirectory || oldSiteService.publishDirectory,
      customizedDomainName: inputs.customizedDomainName || oldSiteService.customizedDomainName,
      acmCertificateARN: inputs.acmCertificateArn || oldSiteService.acmCertificateARN
    }

    const initArgs = [
      "init",
      "-reconfigure",
      `-backend-config=bucket=${state_bucket_name}`,
      `-backend-config=key=${oldSiteService.name}/terraform.tfstate`,
      `-backend-config=region=${updateSiteInput.region}`,
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
      `-var=bucket_name=${`${oldSiteService.name}-site-bucket`}`,
      `-var=project_name=${oldSiteService.name}`,
      `-var=execution_role_arn=${tf_role_arn}`,
      `-var=aws_region=${updateSiteInput.region}`,
      `-var=github_repo_id=${updateSiteInput.repoId}`,
      `-var=github_branch_name=${updateSiteInput.branchName}`,
      `-var=github_connection_arn=${inputs.githubConnectionArn}`,
      `-var=root_directory=${updateSiteInput.rootDir}`,
      `-var=build_command=${updateSiteInput.buildCommand}`,
      `-var=publish_directory=${updateSiteInput.publishDirectory}`,
    ];

    if (updateSiteInput.customizedDomainName) {
      applyArgs.push(`-var=domain_name=${updateSiteInput.customizedDomainName}`);
    }

    if (updateSiteInput.acmCertificateARN) {
      applyArgs.push(`-var=acm_certificate_arn=${updateSiteInput.acmCertificateARN}`);
    }

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

    const {updateSiteTransaction} = serviceUpdater;
    updateSiteInput.cloudFrontDomainName = outputs.cloudfront_domain_name.value

    updateSiteTransaction(service_id, updateSiteInput);
    const credential = await assumeRole();
    await manualDeploy(credential, `${oldSiteService.name}-pipeline`)
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

export { updateStaticSite };
export type { UpdateStaticSiteInput };
