import {beforeEach, describe, expect, it, vi} from "vitest";
import {
  createStaticSite, type CreateStaticSiteInput,
} from "@/services/deploymentService/static-site/create.js";
import {
  STRICT_TF_ROLE_ARN as tf_role_arn,
  STRICT_AWS_REGION as region,
} from "@/config/aws.config.js";

const mockCreateService = vi.fn()

const mockCreateStaticSiteDeps = {
  serviceCreator: {
    // This is actually safe since we won't make use of the result of calling it
    createSiteTransaction: mockCreateService as any
  },
  runTofu: vi.fn(() => Promise.resolve()),
  runTofuAndCollect: vi.fn(() => Promise.resolve(`
  {
    "cloudfront_domain_name": {
      "value": "123.cloudfront.net"
    }
  }`)),
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
} = mockCreateStaticSiteDeps

const testInputs: CreateStaticSiteInput = {
  projectName: "demo-static-site",

  githubRepoId: "e-hua/CloudWrap",
  githubBranchName: "dev",
  githubConnectionArn:
    "arn:aws:codestar-connections:us-east-2:276291856310:connection/e7b8cd7c-295f-4776-9f93-4356f180edd6",
  rootDirectory: "frontend",
  buildCommand: "npm run build",
  publishDirectory: "dist",
};


const mockCreateStaticSiteInputs = {
  inputs: testInputs,
  onStreamCallback: vi.fn()
}

describe("Creating static site services", () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should call all critical dependencies with correct inputs", async () => {
    await createStaticSite(mockCreateStaticSiteInputs, mockCreateStaticSiteDeps)

    expect(mockMkdtemp).toHaveBeenCalledOnce()
    expect(mockCopy).toHaveBeenCalledOnce()
    expect(mockTmpdir).toHaveBeenCalledOnce()
    expect(mockRunTofu)
    expect(mockCreateService).toHaveBeenCalledWith({
      name: testInputs.projectName,
      type: "static-site",
      group_id: undefined,
      region: region,
      repoId: testInputs.githubRepoId,
      branchName: testInputs.githubBranchName,
      rootDir: testInputs.rootDirectory,
      cloudFrontDomainName: "123.cloudfront.net",

      buildCommand: testInputs.buildCommand,
      publishDirectory: testInputs.publishDirectory,
      customizedDomainName: testInputs.customizedDomainName,
      acmCertificateARN: testInputs.acmCertificateArn,
    })
    expect(mockRm).toHaveBeenCalledOnce()
  })

  it("should call OpenTofu with OPTIONAL ARGS when specified in the input", async () => {
    const newMockCreateStaticSiteInputs =  {
      inputs: {
        ...testInputs,
        customizedDomainName: "aws.amazon.com",
        acmCertificateArn: "arn:aws:acm:region:account-id:certificate/certificate-id",
      },
      onStreamCallback: vi.fn()
    }

    await createStaticSite(newMockCreateStaticSiteInputs, mockCreateStaticSiteDeps)
    expect(mockRunTofu).toHaveBeenCalledWith({
      args: [
        "apply",
        "-auto-approve",
        `-var=bucket_name=${`${testInputs.projectName}-site-bucket`}`,
        `-var=project_name=${testInputs.projectName}`,
        `-var=execution_role_arn=${tf_role_arn}`,
        `-var=aws_region=${region}`,
        `-var=github_repo_id=${testInputs.githubRepoId}`,
        `-var=github_branch_name=${testInputs.githubBranchName}`,
        `-var=github_connection_arn=${testInputs.githubConnectionArn}`,
        `-var=root_directory=${testInputs.rootDirectory}`,
        `-var=build_command=${testInputs.buildCommand}`,
        `-var=publish_directory=${testInputs.publishDirectory}`,
        `-var=domain_name=${newMockCreateStaticSiteInputs.inputs.customizedDomainName}`,
        `-var=acm_certificate_arn=${newMockCreateStaticSiteInputs.inputs.acmCertificateArn}`,
      ],
      dirPath: "tmp/dir/path",
      // Need to keep the reference exactly the same
      onStream: newMockCreateStaticSiteInputs.onStreamCallback
    })
  })

  it("should not add OPTIONAL ARGS when not specified", async () => {
    await createStaticSite(mockCreateStaticSiteInputs, mockCreateStaticSiteDeps)
    expect(mockRunTofu).toHaveBeenCalledWith({
      args: [
        "apply",
        "-auto-approve",
        `-var=bucket_name=${`${testInputs.projectName}-site-bucket`}`,
        `-var=project_name=${testInputs.projectName}`,
        `-var=execution_role_arn=${tf_role_arn}`,
        `-var=aws_region=${region}`,
        `-var=github_repo_id=${testInputs.githubRepoId}`,
        `-var=github_branch_name=${testInputs.githubBranchName}`,
        `-var=github_connection_arn=${testInputs.githubConnectionArn}`,
        `-var=root_directory=${testInputs.rootDirectory}`,
        `-var=build_command=${testInputs.buildCommand}`,
        `-var=publish_directory=${testInputs.publishDirectory}`,
      ],
      dirPath: "tmp/dir/path",
      onStream: mockCreateStaticSiteInputs.onStreamCallback
    })
  })

  it("should throw an ERROR when not being able to insert into DB", async () => {
    // Sync errors
    mockCreateService.mockImplementationOnce(() => {
      throw new Error("Mock DB error");
    })

    // Tips: Use await + rejects to test the rejection result of an async function
    await expect(createStaticSite(mockCreateStaticSiteInputs, mockCreateStaticSiteDeps))
      .rejects
      .toThrow("Mock DB error")

    expect(mockRunTofu).not.toHaveBeenCalledOnce()

    // Final cleanup block still runs
    expect(mockRm).toHaveBeenCalledWith("tmp/dir/path", { recursive: true, force: true })

  })

  it("should PASS THE BUCK when runTofu end with an error", async () => {
    mockRunTofu.mockRejectedValueOnce(new Error("Mock OpenTofu error"))

    await expect(createStaticSite(mockCreateStaticSiteInputs, mockCreateStaticSiteDeps))
      .rejects
      .toThrow("Mock OpenTofu error")
    expect(mockRunTofu).toHaveBeenCalledOnce()
    expect(mockCreateStaticSiteInputs.onStreamCallback).toHaveBeenCalledWith({
      source: "sys-failure", data: "Mock OpenTofu error"
    })

    // Final cleanup block still runs
    expect(mockRm).toHaveBeenCalledWith("tmp/dir/path", { recursive: true, force: true })
  })
})
