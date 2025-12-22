import {beforeEach, describe, expect, it, vi} from "vitest";
import {
  STRICT_TF_ROLE_ARN as tf_role_arn,
  STRICT_AWS_REGION as region,
} from "@/config/aws.config.js";
import type {CreateServerInput} from "@/services/deploymentService/deployment.schema.js";
import {createServer} from "@/services/deploymentService/ECS-on-EC2/create.js";

const mockCreateService = vi.fn()

const mySecrete = "Hello, World!"
const mockCreateServerDeps = {
  serviceCreator: {
    // This is actually safe since we won't make use of the result of calling it
    createServerTransaction: mockCreateService as any
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
  randomBytes: vi.fn(() => Buffer.from(mySecrete, 'utf8'))
}

const {
  runTofu: mockRunTofu,
  mkdtemp: mockMkdtemp,
  copy: mockCopy,
  rm: mockRm,
  tmpdir: mockTmpdir,
  randomBytes: mockRandomBytes
} = mockCreateServerDeps

const testInputs: CreateServerInput = {
  projectName: "demo-static-site",

  githubRepoId: "e-hua/CloudWrap",
  githubBranchName: "dev",
  githubConnectionArn:
    "arn:aws:codestar-connections:us-east-2:276291856310:connection/e7b8cd7c-295f-4776-9f93-4356f180edd6",
  rootDirectory: "backend",

  container_port: 3030,
  instance_type: "t3.nano",
  dockerfile_path: "Dockerfile",
};


const mockCreateServerInputs = {
  inputs: testInputs,
  onStreamCallback: vi.fn()
}

describe("Creating static site services", () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should call all critical dependencies with correct inputs", async () => {
    await createServer(mockCreateServerInputs, mockCreateServerDeps)

    expect(mockMkdtemp).toHaveBeenCalledOnce()
    expect(mockCopy).toHaveBeenCalledOnce()
    expect(mockTmpdir).toHaveBeenCalledOnce()
    expect(mockRunTofu)
    expect(mockCreateService).toHaveBeenCalledWith({
      name: testInputs.projectName,
      type: "server",
      group_id: undefined,
      region: region,
      repoId: testInputs.githubRepoId,
      branchName: testInputs.githubBranchName,
      rootDir: testInputs.rootDirectory,
      cloudFrontDomainName: "123.cloudfront.net",

      containerPort: testInputs.container_port,
      instanceType: testInputs.instance_type,
      dockerfilePath: testInputs.dockerfile_path,
      secretHeaderValue: Buffer.from(mySecrete, 'utf8').toString("hex"),
    })
    expect(mockRm).toHaveBeenCalledOnce()
  })

  it("should call OpenTofu", async () => {
    await createServer(mockCreateServerInputs, mockCreateServerDeps)

    expect(mockRunTofu).toHaveBeenCalledWith({
      args: [
        "apply",
        "-auto-approve",
        `-var=aws_region=${region}`,
        `-var=project_name=${testInputs.projectName}`,
        `-var=execution_role_arn=${tf_role_arn}`,
        `-var=container_port=${testInputs.container_port}`,
        `-var=secret_header_value=${Buffer.from(mySecrete, 'utf8').toString("hex")}`,

        `-var=github_repo_id=${testInputs.githubRepoId}`,
        `-var=github_branch_name=${testInputs.githubBranchName}`,
        `-var=github_connection_arn=${testInputs.githubConnectionArn}`,
        `-var=instance_type=${testInputs.instance_type}`,
        `-var=root_directory=${testInputs.rootDirectory}`,
        `-var=dockerfile_path=${testInputs.dockerfile_path}`,
      ],
      dirPath: "tmp/dir/path",
      // Need to keep the reference exactly the same
      onStream: mockCreateServerInputs.onStreamCallback
    })
  })

  it("should throw an ERROR when not being able to insert into DB", async () => {
    // Sync errors
    mockCreateService.mockImplementationOnce(() => {
      throw new Error("Mock DB error");
    })

    // Tips: Use await + rejects to test the rejection result of an async function
    await expect(createServer(mockCreateServerInputs, mockCreateServerDeps))
      .rejects
      .toThrow("Mock DB error")

    expect(mockRunTofu).not.toHaveBeenCalledOnce()

    // Final cleanup block still runs
    expect(mockRm).toHaveBeenCalledWith("tmp/dir/path", { recursive: true, force: true })
  })

  it("should PASS THE BUCK when runTofu end with an error", async () => {
    mockRunTofu.mockRejectedValueOnce(new Error("Mock OpenTofu error"))

    await expect(createServer(mockCreateServerInputs, mockCreateServerDeps))
      .rejects
      .toThrow("Mock OpenTofu error")
    expect(mockRunTofu).toHaveBeenCalledOnce()
    expect(mockCreateServerInputs.onStreamCallback).toHaveBeenCalledWith({
      source: "sys-failure", data: "Mock OpenTofu error"
    })

    // Final cleanup block still runs
    expect(mockRm).toHaveBeenCalledWith("tmp/dir/path", { recursive: true, force: true })
  })
})
