import path from "path";
import {
  STRICT_TF_STATE_BUCKET as state_bucket_name,
  STRICT_AWS_REGION as region,
  STRICT_TF_ROLE_ARN as tf_role_arn,
} from "@/config/aws.config.js";
import { getErrorMessage } from "@/utils/errors.js";

import {type StreamData} from "../runTofu.js";
import type {DBServerType, DBSiteType} from "@/db/queries/Services/Services.types.js";
import Database from "better-sqlite3";
import type {ServiceOperationDeps} from "@/services/deploymentService/deployment.types.js";
import { templateDirPath } from "../pathConfig.js";


type DeleteStaticSiteDeps = ServiceOperationDeps & {
  serviceReader: {
    readServiceById: (serviceId: (number | bigint)) => (DBServerType | DBSiteType)
  };
  serviceDeleter: {
    deleteServiceTransaction: Database.Transaction<(id: (number | bigint)) => (bigint | number)>
  }
}

type DeleteStaticSiteInputs = {
  service_id: number,
  githubConnectionArn: string,
  onStreamCallback: (data: StreamData) => void
}

async function deleteStaticSite(
  {service_id, githubConnectionArn, onStreamCallback} : DeleteStaticSiteInputs,
  {serviceReader, serviceDeleter, runTofu, mkdtemp, copy, rm, tmpdir}: DeleteStaticSiteDeps
): Promise<void> {
  const templatePath = path.join(
    templateDirPath,
    "opentofu",
    "static-site"
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

    const oldSiteService = readServiceById(service_id) as DBSiteType | undefined

    if (!oldSiteService || oldSiteService.type !== 'static-site') {
      throw new Error(`Service with ID ${service_id} not found as static-site`)
    }

    const initArgs = [
      "init",
      "-reconfigure",
      `-backend-config=bucket=${state_bucket_name}`,
      `-backend-config=key=${oldSiteService.name}/terraform.tfstate`,
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
      `-var=bucket_name=${`${oldSiteService.name}-site-bucket`}`,
      `-var=project_name=${oldSiteService.name}`,
      `-var=execution_role_arn=${tf_role_arn}`,
      `-var=aws_region=${oldSiteService.region}`,
      `-var=github_repo_id=${oldSiteService.repoId}`,
      `-var=github_branch_name=${oldSiteService.branchName}`,
      `-var=github_connection_arn=${githubConnectionArn}`,
      `-var=root_directory=${oldSiteService.rootDir}`,
      `-var=build_command=${oldSiteService.buildCommand}`,
      `-var=publish_directory=${oldSiteService.publishDirectory}`,
    ];

    if (oldSiteService.customizedDomainName) {
      destroyArgs.push(`-var=domain_name=${oldSiteService.customizedDomainName}`);
    }

    if (oldSiteService.acmCertificateARN) {
      destroyArgs.push(`-var=acm_certificate_arn=${oldSiteService.acmCertificateARN}`);
    }

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

export { deleteStaticSite };
export type {DeleteStaticSiteDeps, DeleteStaticSiteInputs}