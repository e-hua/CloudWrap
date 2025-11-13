import path from "path";
import {
  STRICT_TF_STATE_BUCKET as state_bucket_name,
  STRICT_AWS_REGION as region,
  STRICT_TF_ROLE_ARN as tf_role_arn,
} from "@/config/aws.config.js";
import { getErrorMessage } from "@/utils/errors.js";

import { fileURLToPath } from "url";
import {type RunTofuCommand, type StreamData} from "../runTofu.js";
import type {DBSiteInput} from "@/db/queries/Services/Services.types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This function create a new temporary directory
// runs 'tofu init' 'tofu apply' in them
import type {CreateStaticSiteInput} from "@/services/deploymentService/deployment.schema.js";
import type {ServiceOperationDeps} from "@/services/deploymentService/deployment.types.js";
import Database from "better-sqlite3";

type CreateStaticSiteDeps = ServiceOperationDeps & {
  serviceCreator: {
    createSiteTransaction: Database.Transaction<(input: DBSiteInput) => (bigint | number)>
  };
  runTofuAndCollect: (command:  Omit<RunTofuCommand, 'onStream'>) => Promise<string>
}

type CreateStaticSiteInputs = {
  inputs: CreateStaticSiteInput;
  onStreamCallback: (data: StreamData) => void
}

async function createStaticSite(
  {inputs, onStreamCallback} : CreateStaticSiteInputs,
  {serviceCreator, runTofu, runTofuAndCollect, mkdtemp, copy, rm, tmpdir}: CreateStaticSiteDeps
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

    const initArgs = [
      "init",
      "-reconfigure",
      `-backend-config=bucket=${state_bucket_name}`,
      `-backend-config=key=${inputs.projectName}/terraform.tfstate`,
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
      `-var=bucket_name=${`${inputs.projectName}-site-bucket`}`,
      `-var=project_name=${inputs.projectName}`,
      `-var=execution_role_arn=${tf_role_arn}`,
      `-var=aws_region=${region}`,
      `-var=github_repo_id=${inputs.githubRepoId}`,
      `-var=github_branch_name=${inputs.githubBranchName}`,
      `-var=github_connection_arn=${inputs.githubConnectionArn}`,
      `-var=root_directory=${inputs.rootDirectory}`,
      `-var=build_command=${inputs.buildCommand}`,
      `-var=publish_directory=${inputs.publishDirectory}`,
    ];

    if (inputs.customizedDomainName) {
      applyArgs.push(`-var=domain_name=${inputs.customizedDomainName}`);
    }

    if (inputs.acmCertificateArn) {
      applyArgs.push(`-var=acm_certificate_arn=${inputs.acmCertificateArn}`);
    }

    // Run tofu apply command
    await runTofu({
      args: applyArgs,
      dirPath: tempDir,
      onStream: onStreamCallback,
    });

    onStreamCallback({
      source: "sys-info",
      data: "Retrieving the service info and inserting h",
    });

    const collectArgs = ['output', '-json']

    const jsonOutputs = await runTofuAndCollect({args: collectArgs, dirPath: tempDir})
    const outputs = JSON.parse(jsonOutputs)

    const {createSiteTransaction} = serviceCreator;
    const siteInput: DBSiteInput = {
      name: inputs.projectName,
      type: "static-site",
      group_id: undefined,
      region: region,
      repoId: inputs.githubRepoId,
      branchName: inputs.githubBranchName,
      rootDir: inputs.rootDirectory,
      cloudFrontDomainName: outputs.cloudfront_domain_name.value,

      buildCommand: inputs.buildCommand,
      publishDirectory: inputs.publishDirectory,
      customizedDomainName: inputs.customizedDomainName,
      acmCertificateARN: inputs.acmCertificateArn,
    };

    createSiteTransaction(siteInput);
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

export { createStaticSite };
export type { CreateStaticSiteInput, CreateStaticSiteDeps};
