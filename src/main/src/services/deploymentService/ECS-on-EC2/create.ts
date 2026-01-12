import path from "path";
import { type RunTofuCommand, type StreamData } from "../runTofu.js";
import { getStrictAwsRegion, getStrictTofuConfig } from "@/config/aws.config.js";
import { getErrorMessage } from "@/utils/errors.js";
import type { DBServerInput } from "@/db/queries/Services/Services.types.js";

import type { CreateServerInput } from "@/services/deploymentService/deployment.schema.js";
import type { ServiceOperationDeps } from "@/services/deploymentService/deployment.types.js";
import Database from "better-sqlite3";
import { templateDirPath } from "../pathConfig.js";

type CreateServerDeps = ServiceOperationDeps & {
  serviceCreator: {
    createServerTransaction: Database.Transaction<(input: DBServerInput) => bigint | number>;
  };
  runTofuAndCollect: (command: Omit<RunTofuCommand, "onStream">) => Promise<string>;
  randomBytes: (size: number) => Buffer;
};

type CreateServerInputs = {
  inputs: CreateServerInput;
  onStreamCallback: (data: StreamData) => void;
};

async function createServer(
  { inputs, onStreamCallback }: CreateServerInputs,
  {
    serviceCreator,
    runTofu,
    runTofuAndCollect,
    mkdtemp,
    copy,
    rm,
    tmpdir,
    randomBytes
  }: CreateServerDeps
): Promise<void> {
  const region = getStrictAwsRegion();
  const { tfProvisionRoleArn, tfStateBucket } = getStrictTofuConfig();

  const templatePath = path.join(templateDirPath, "opentofu", "server", "ECS-on-EC2");
  // Using temporary folder to carry out the deployment
  // E.g. final directory path: '/tmp/cloudwrap-deployment-aB1xZ2'
  const tempDir = await mkdtemp(path.join(tmpdir(), "cloudwrap-deployment-"));
  // This creates a 64-character-long, highly random hex string
  const generatedSecret = randomBytes(32).toString("hex");

  try {
    await copy(templatePath, tempDir);
    onStreamCallback({
      source: "sys-info",
      data: "Finished copying the template files"
    });

    onStreamCallback({
      source: "sys-info",
      data: "Start initializing the project"
    });

    const initArgs = [
      "init",
      "-reconfigure",
      `-backend-config=bucket=${tfStateBucket}`,
      `-backend-config=key=${inputs.projectName}/terraform.tfstate`,
      `-backend-config=region=${region}`
    ];

    // Run tofu init command
    await runTofu({
      args: initArgs,
      dirPath: tempDir,
      onStream: onStreamCallback
    });

    onStreamCallback({
      source: "sys-info",
      data: "Finished initializing the project!"
    });

    onStreamCallback({
      source: "sys-info",
      data: "Start applying modifications to the project, might take a couple of minutes"
    });

    const applyArgs = [
      "apply",
      "-auto-approve",
      `-var=aws_region=${region}`,
      `-var=project_name=${inputs.projectName}`,
      `-var=execution_role_arn=${tfProvisionRoleArn}`,
      `-var=container_port=${inputs.container_port}`,
      `-var=secret_header_value=${generatedSecret}`,

      `-var=github_repo_id=${inputs.githubRepoId}`,
      `-var=github_branch_name=${inputs.githubBranchName}`,
      `-var=github_connection_arn=${inputs.githubConnectionArn}`,
      `-var=instance_type=${inputs.instance_type}`,
      `-var=root_directory=${inputs.rootDirectory}`,
      `-var=dockerfile_path=${inputs.dockerfile_path}`
    ];

    // Run tofu apply command
    await runTofu({
      args: applyArgs,
      dirPath: tempDir,
      onStream: onStreamCallback
    });

    const collectArgs = ["output", "-json"];

    const jsonOutputs = await runTofuAndCollect({ args: collectArgs, dirPath: tempDir });
    const outputs = JSON.parse(jsonOutputs);

    const { createServerTransaction } = serviceCreator;
    const serverInput: DBServerInput = {
      name: inputs.projectName,
      type: "server",
      group_id: undefined,
      region: region,
      repoId: inputs.githubRepoId,
      branchName: inputs.githubBranchName,
      rootDir: inputs.rootDirectory,
      cloudFrontDomainName: outputs.application_url.value,

      containerPort: inputs.container_port,
      instanceType: inputs.instance_type,
      dockerfilePath: inputs.dockerfile_path,
      secretHeaderValue: generatedSecret
    };

    createServerTransaction(serverInput);
  } catch (err) {
    onStreamCallback({ source: "sys-failure", data: getErrorMessage(err) });
    throw err;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
    onStreamCallback({
      source: "sys-info",
      data: "Finished deleting the temporary deployment worksapce"
    });
  }
}

export { createServer };
export type { CreateServerInput };
export type { CreateServerInputs, CreateServerDeps };
