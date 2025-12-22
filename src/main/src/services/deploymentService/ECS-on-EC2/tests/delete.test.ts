import {beforeEach, describe, expect, it, vi} from "vitest";
import type {DBServerType, DBSiteType} from "@/db/queries/Services/Services.types.js";
import {
  deleteStaticSite,
} from "@/services/deploymentService/static-site/delete.js";
import {STRICT_TF_ROLE_ARN as tf_role_arn} from "@/config/aws.config.js";
import {deleteServer} from "@/services/deploymentService/ECS-on-EC2/delete.js";

const mockReadServiceById = vi.fn()
const mockDeleteServiceTransaction = vi.fn()

const mockDeleteServerDeps = {
  serviceReader: {
    readServiceById: mockReadServiceById
  },
  serviceDeleter: {
    // This is actually safe since we won't make use of the result of calling it
    deleteServiceTransaction: mockDeleteServiceTransaction as any
  },
  runTofu: vi.fn(() => Promise.resolve()),
  mkdtemp: vi.fn(() => Promise.resolve("tmp/dir/path")),
  copy: vi.fn(() => Promise.resolve()),
  rm: vi.fn(() => Promise.resolve()),
  tmpdir: vi.fn(() => "tmp/")
}

const {
  runTofu: mockRunTofu,
  mkdtemp: mockMkdtemp,
  copy: mockCopy,
  rm: mockRm,
  tmpdir: mockTmpdir
} = mockDeleteServerDeps

const mockDeleteServerInputs = {
  service_id: 1,
  githubConnectionArn: "arn:mock-value",
  onStreamCallback: vi.fn()
}

const mockServerService: DBServerType = {
  name: "mock-server",
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
  secretHeaderValue: "some-dummy-value",

  id: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

describe("Deleting and destroying a web server service", () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should call all critical dependencies with correct inputs", async () => {
    mockReadServiceById.mockReturnValueOnce(mockServerService)
    await deleteServer(mockDeleteServerInputs, mockDeleteServerDeps)

    expect(mockReadServiceById).toHaveBeenCalledOnce()
    expect(mockMkdtemp).toHaveBeenCalledOnce()
    expect(mockCopy).toHaveBeenCalledOnce()
    expect(mockTmpdir).toHaveBeenCalledOnce()

    expect(mockDeleteServiceTransaction).toHaveBeenCalledOnce()
    expect(mockRm).toHaveBeenCalledOnce()
  })

  it("should not add OPTIONAL ARGS when not specified", async () => {
    mockReadServiceById.mockReturnValueOnce({
      ...mockServerService,
      customizedDomainName: undefined,
      acmCertificateARN: undefined
    })
    await deleteServer(mockDeleteServerInputs, mockDeleteServerDeps)
    expect(mockRunTofu).toHaveBeenCalledWith({
      args: [
        "destroy",
        "-auto-approve",
        `-var=aws_region=${mockServerService.region}`,
        `-var=project_name=${mockServerService.name}`,
        `-var=execution_role_arn=${tf_role_arn}`,
        `-var=container_port=${mockServerService.containerPort}`,
        `-var=secret_header_value=${mockServerService.secretHeaderValue}`,

        `-var=github_repo_id=${mockServerService.repoId}`,
        `-var=github_branch_name=${mockServerService.branchName}`,
        `-var=github_connection_arn=${mockDeleteServerInputs.githubConnectionArn}`,
        `-var=instance_type=${mockServerService.instanceType}`,
        `-var=root_directory=${mockServerService.rootDir}`,
        `-var=dockerfile_path=${mockServerService.dockerfilePath}`,
        // This is to prevent waiting indefinitely
        `-var=desired_count=0`,
      ],
      dirPath: "tmp/dir/path",
      onStream: mockDeleteServerInputs.onStreamCallback
    })

  })

  it("should throw an ERROR when retrieved service is not of the correct TYPE", async () => {
    mockReadServiceById.mockReturnValueOnce({
      ...mockServerService,
      type: "static-site"
    })

    // Tips: Use await + rejects to test the rejection result of an async function
    await expect(deleteServer(mockDeleteServerInputs, mockDeleteServerDeps))
      .rejects
      .toThrow(`Service with ID ${mockServerService.id} not found as server`)

    expect(mockRunTofu).not.toHaveBeenCalledOnce()

    expect(mockRm).toHaveBeenCalledWith("tmp/dir/path", { recursive: true, force: true })
  })

  it("should PASS THE BUCK when runTofu end with an error", async () => {
    mockReadServiceById.mockReturnValueOnce(mockServerService)
    mockRunTofu.mockRejectedValueOnce(new Error("Mock OpenTofu error"))

    await expect(deleteServer(mockDeleteServerInputs, mockDeleteServerDeps))
      .rejects
      .toThrow("Mock OpenTofu error")
    expect(mockRunTofu).toHaveBeenCalledOnce()
    expect(mockDeleteServerInputs.onStreamCallback).toHaveBeenCalledWith({
      source: "sys-failure", data: "Mock OpenTofu error"
    })

    // Final cleanup block still runs
    expect(mockRm).toHaveBeenCalledWith("tmp/dir/path", { recursive: true, force: true })
  })
})
