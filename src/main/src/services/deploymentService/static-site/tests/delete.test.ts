import {beforeEach, describe, expect, it, vi} from "vitest";
import type {DBSiteType} from "@/db/queries/Services/Services.types.js";
import {
  deleteStaticSite,
} from "@/services/deploymentService/static-site/delete.js";
import {STRICT_TF_ROLE_ARN as tf_role_arn} from "@/config/aws.config.js";

const mockReadServiceById = vi.fn()
const mockDeleteServiceTransaction = vi.fn()

const mockDeleteStaticSiteDeps = {
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
} = mockDeleteStaticSiteDeps

const mockDeleteStaticSiteInputs = {
  service_id: 1,
  githubConnectionArn: "arn:mock-value",
  onStreamCallback: vi.fn()
}

const mockSiteService: DBSiteType = {
  name: "mock-site",
  type: "static-site",
  group_id: undefined,
  region: "us-east-1",
  repoId: "e-hua/CloudWrap",
  branchName: "dev",
  rootDir: "frontend",
  cloudFrontDomainName: "123.cloudfront.net",
  buildCommand: "npm run build",
  publishDirectory: "dist",
  customizedDomainName: "aws.amazon.com",
  acmCertificateARN: "arn:aws:acm:region:account-id:certificate/certificate-id",
  id: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

describe("Deleting and destroying a static site service", () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should call all critical dependencies with correct inputs", async () => {
    mockReadServiceById.mockReturnValueOnce(mockSiteService)
    await deleteStaticSite(mockDeleteStaticSiteInputs, mockDeleteStaticSiteDeps)

    expect(mockReadServiceById).toHaveBeenCalledOnce()
    expect(mockMkdtemp).toHaveBeenCalledOnce()
    expect(mockCopy).toHaveBeenCalledOnce()
    expect(mockTmpdir).toHaveBeenCalledOnce()

    expect(mockDeleteServiceTransaction).toHaveBeenCalledOnce()
    expect(mockRm).toHaveBeenCalledOnce()
  })

  it("should call OpenTofu with OPTIONAL ARGS when specified in the input", async () => {
    mockReadServiceById.mockReturnValueOnce(mockSiteService)
    await deleteStaticSite(mockDeleteStaticSiteInputs, mockDeleteStaticSiteDeps)
    expect(mockRunTofu).toHaveBeenCalledWith({
      args: [
        "destroy",
        "-auto-approve",
        `-var=bucket_name=${`${mockSiteService.name}-site-bucket`}`,
        `-var=project_name=${mockSiteService.name}`,
        `-var=execution_role_arn=${tf_role_arn}`,
        `-var=aws_region=${mockSiteService.region}`,
        `-var=github_repo_id=${mockSiteService.repoId}`,
        `-var=github_branch_name=${mockSiteService.branchName}`,
        `-var=github_connection_arn=${mockDeleteStaticSiteInputs.githubConnectionArn}`,
        `-var=root_directory=${mockSiteService.rootDir}`,
        `-var=build_command=${mockSiteService.buildCommand}`,
        `-var=publish_directory=${mockSiteService.publishDirectory}`,
        `-var=domain_name=${mockSiteService.customizedDomainName}`,
        `-var=acm_certificate_arn=${mockSiteService.acmCertificateARN}`,
      ],
      dirPath: "tmp/dir/path",
      onStream: mockDeleteStaticSiteInputs.onStreamCallback
    })
  })

  it("should not add OPTIONAL ARGS when not specified", async () => {
    mockReadServiceById.mockReturnValueOnce({
      ...mockSiteService,
      customizedDomainName: undefined,
      acmCertificateARN: undefined
    })
    await deleteStaticSite(mockDeleteStaticSiteInputs, mockDeleteStaticSiteDeps)
    expect(mockRunTofu).toHaveBeenCalledWith({
      args: [
        "destroy",
        "-auto-approve",
        `-var=bucket_name=${`${mockSiteService.name}-site-bucket`}`,
        `-var=project_name=${mockSiteService.name}`,
        `-var=execution_role_arn=${tf_role_arn}`,
        `-var=aws_region=${mockSiteService.region}`,
        `-var=github_repo_id=${mockSiteService.repoId}`,
        `-var=github_branch_name=${mockSiteService.branchName}`,
        `-var=github_connection_arn=${mockDeleteStaticSiteInputs.githubConnectionArn}`,
        `-var=root_directory=${mockSiteService.rootDir}`,
        `-var=build_command=${mockSiteService.buildCommand}`,
        `-var=publish_directory=${mockSiteService.publishDirectory}`,
      ],
      dirPath: "tmp/dir/path",
      onStream: mockDeleteStaticSiteInputs.onStreamCallback
    })

  })

  it("should throw an ERROR when retrieved service is not of the correct TYPE", async () => {
    mockReadServiceById.mockReturnValueOnce({
      ...mockSiteService,
      type: "server"
    })

    // Tips: Use await + rejects to test the rejection result of an async function
    await expect(deleteStaticSite(mockDeleteStaticSiteInputs, mockDeleteStaticSiteDeps))
      .rejects
      .toThrow(`Service with ID ${mockSiteService.id} not found as static-site`)

    expect(mockRunTofu).not.toHaveBeenCalledOnce()

    expect(mockRm).toHaveBeenCalledWith("tmp/dir/path", { recursive: true, force: true })
  })

  it("should PASS THE BUCK when runTofu end with an error", async () => {
    mockReadServiceById.mockReturnValueOnce(mockSiteService);
    mockRunTofu.mockRejectedValueOnce(new Error("Mock OpenTofu error"))

    await expect(deleteStaticSite(mockDeleteStaticSiteInputs, mockDeleteStaticSiteDeps))
      .rejects
      .toThrow("Mock OpenTofu error")
    expect(mockRunTofu).toHaveBeenCalledOnce()
    expect(mockDeleteStaticSiteInputs.onStreamCallback).toHaveBeenCalledWith({
      source: "sys-failure", data: "Mock OpenTofu error"
    })

    // Final cleanup block still runs
    expect(mockRm).toHaveBeenCalledWith("tmp/dir/path", { recursive: true, force: true })
  })
})