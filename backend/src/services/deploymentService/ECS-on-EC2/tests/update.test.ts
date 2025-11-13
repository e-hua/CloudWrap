import {beforeEach, describe, expect, it, vi} from "vitest";
import type {DBServerType, DBSiteType} from "@/db/queries/Services/Services.types.js";
import {
  STRICT_TF_ROLE_ARN as tf_role_arn,
  STRICT_AWS_REGION as region,
} from "@/config/aws.config.js";
import type {
  CreateStaticSiteInput,
  UpdateServerInput,
  UpdateStaticSiteInput
} from "@/services/deploymentService/deployment.schema.js";
import {updateStaticSite} from "@/services/deploymentService/static-site/update.js";
import {updateServer} from "@/services/deploymentService/ECS-on-EC2/update.js";

const mockReadServiceById = vi.fn()
const mockUpdateServiceTransaction = vi.fn()

const mockUpdateServerDeps = {
  serviceReader: {
    readServiceById: mockReadServiceById
  },
  serviceUpdater: {
    // This is actually safe since we won't make use of the result of calling it
    updateServerTransaction: mockUpdateServiceTransaction as any
  },
  runTofu: vi.fn(() => Promise.resolve()),
  runTofuAndCollect: vi.fn(() => Promise.resolve(`
  {
    "application_url": {
      "value": "123.cloudfront.net"
    }
  }`)),
  mkdtemp: vi.fn(() => Promise.resolve("tmp/dir/path")),
  copy: vi.fn(() => Promise.resolve()),
  rm: vi.fn(() => Promise.resolve()),
  tmpdir: vi.fn(() => "tmp/"),
  manualDeploy: vi.fn(),
  assumeRole: vi.fn(),
}

const {
  runTofu: mockRunTofu,
  mkdtemp: mockMkdtemp,
  copy: mockCopy,
  rm: mockRm,
  tmpdir: mockTmpdir,
  manualDeploy: mockManualDeploy,
  assumeRole: mockAssumeRole
} = mockUpdateServerDeps

const testInputs: UpdateServerInput = {
  githubBranchName: "main",
  githubConnectionArn:
    "arn:aws:codestar-connections:us-east-2:276291856310:connection/e7b8cd7c-295f-4776-9f93-4356f180edd6",
};

const mySecrete = "Hello, World!"

const mockUpdateServerInputs = {
  service_id: 1,
  inputs: testInputs,
  onStreamCallback: vi.fn()
}

const mockServerService: DBServerType = {
  name: "mock-site",
  type: "server",
  group_id: undefined,
  region: "us-east-1",
  repoId: "e-hua/CloudWrap",
  branchName: "dev",
  rootDir: "frontend",
  cloudFrontDomainName: "123.cloudfront.net",

  containerPort: 3030,
  instanceType: "t3.nano",
  dockerfilePath: "Dockerfile",
  secretHeaderValue: Buffer.from(mySecrete, 'utf8').toString("hex"),

  id: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

describe("Updating a static site service", () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should call all critical dependencies with correct inputs", async () => {
    mockReadServiceById.mockReturnValueOnce(mockServerService)
    await updateServer(mockUpdateServerInputs, mockUpdateServerDeps)

    expect(mockReadServiceById).toHaveBeenCalledOnce()
    expect(mockMkdtemp).toHaveBeenCalledOnce()
    expect(mockCopy).toHaveBeenCalledOnce()
    expect(mockTmpdir).toHaveBeenCalledOnce()

    expect(mockUpdateServiceTransaction).toHaveBeenCalledOnce()
    expect(mockAssumeRole).toHaveBeenCalledOnce()
    expect(mockManualDeploy).toHaveBeenCalledOnce()
    expect(mockRm).toHaveBeenCalledOnce()
  })

  it("should call OpenTofu with OPTIONAL ARGS when specified in the input", async () => {
    mockReadServiceById.mockReturnValueOnce(mockServerService)
    await updateServer(mockUpdateServerInputs, mockUpdateServerDeps)
    expect(mockRunTofu).toHaveBeenCalledWith({
      args: [
        "apply",
        "-auto-approve",
        `-var=github_connection_arn=${testInputs.githubConnectionArn}`,

        `-var=aws_region=${region}`,
        `-var=project_name=${mockServerService.name}`,
        `-var=execution_role_arn=${tf_role_arn}`,
        `-var=github_repo_id=${mockServerService.repoId}`,
        `-var=github_branch_name=${testInputs.githubBranchName}`,
        `-var=root_directory=${mockServerService.rootDir}`,

        `-var=container_port=${mockServerService.containerPort}`,
        `-var=instance_type=${mockServerService.instanceType}`,
        `-var=dockerfile_path=${mockServerService.dockerfilePath}`,
        `-var=secret_header_value=${mockServerService.secretHeaderValue}`,
      ],
      dirPath: "tmp/dir/path",
      onStream: mockUpdateServerInputs.onStreamCallback
    })
  })

  it("should throw an ERROR when retrieved service is not of the correct TYPE", async () => {
    mockReadServiceById.mockReturnValueOnce({
      ...mockServerService,
      type: "static-site"
    })

    // Tips: Use await + rejects to test the rejection result of an async function
    await expect(updateServer(mockUpdateServerInputs, mockUpdateServerDeps))
      .rejects
      .toThrow(`Service with ID ${mockUpdateServerInputs.service_id} not found as server`)

    expect(mockRunTofu).not.toHaveBeenCalledOnce()

    expect(mockRm).toHaveBeenCalledWith("tmp/dir/path", { recursive: true, force: true })
  })

  it("should PASS THE BUCK when runTofu end with an error", async () => {
    mockReadServiceById.mockReturnValueOnce(mockServerService)
    mockRunTofu.mockRejectedValueOnce(new Error("Mock OpenTofu error"))

    await expect(updateServer(mockUpdateServerInputs, mockUpdateServerDeps))
      .rejects
      .toThrow("Mock OpenTofu error")
    expect(mockRunTofu).toHaveBeenCalledOnce()
    expect(mockUpdateServerInputs.onStreamCallback).toHaveBeenCalledWith({
      source: "sys-failure", data: "Mock OpenTofu error"
    })

    // Final cleanup block still runs
    expect(mockRm).toHaveBeenCalledWith("tmp/dir/path", { recursive: true, force: true })
  })
})
