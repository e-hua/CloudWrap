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

import { fileURLToPath } from "url";
import { runTofu, type StreamData } from "../runTofu.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type DeployStaticSiteInput = {
  projectName: string;
  siteBucketName: string;

  githubRepoId: string;
  githubBranchName: string;
  githubConnectionArn: string;
  rootDirectory?: string;
  buildCommand?: string;
  publishDirectory?: string;

  domainName?: string;
  acmCertificateArn?: string;
};

// This funciton create a new temporary directory
// runs 'tofu init' 'tofu apply' in them

async function deployStaticSite(
  inputs: DeployStaticSiteInput,
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
      `-var=bucket_name=${inputs.siteBucketName}`,
      `-var=project_name=${inputs.projectName}`,
      `-var=execution_role_arn=${tf_role_arn}`,
      `-var=aws_region=${region}`,
      `-var=github_repo_id=${inputs.githubRepoId}`,
      `-var=github_branch_name=${inputs.githubBranchName}`,
      `-var=github_connection_arn=${inputs.githubConnectionArn}`,
    ];

    if (inputs.domainName) {
      applyArgs.push(`-var=domain_name=${inputs.domainName}`);
    }

    if (inputs.acmCertificateArn) {
      applyArgs.push(`-var=acm_certificate_arn=${inputs.acmCertificateArn}`);
    }

    if (inputs.rootDirectory) {
      applyArgs.push(`-var=root_directory=${inputs.rootDirectory}`);
    }
    if (inputs.buildCommand) {
      applyArgs.push(`-var=build_command=${inputs.buildCommand}`);
    }
    if (inputs.publishDirectory) {
      applyArgs.push(`-var=publish_directory=${inputs.publishDirectory}`);
    }

    // Run tofu apply command
    await runTofu({
      args: applyArgs,
      dirPath: tempDir,
      onStream: onStreamCallback,
    });
  } catch (err) {
    onStreamCallback({ source: "sys-failure", data: getErrorMessage(err) });
    throw err;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
    onStreamCallback({
      source: "sys-info",
      data: "Finished deleting the temporary deployment worksapce",
    });
  }
}

export { deployStaticSite };
export type { DeployStaticSiteInput };
