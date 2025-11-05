import { assumeRole } from "@/services/assumeRoleService.js";
import {
  streamBuildLogs,
  streamPipelineStatus,
  type BuildingLogData,
  type PipelineLogData,
} from "./logs.js";

async function testStreamPipelineStatus() {
  const credential = await assumeRole();
  const pipelineName = "demo-static-site";
  const pipelineExecutionId = "081bff93-570a-417c-98cc-d0226aa9a6bc";
  const onStreamPrint = (data: PipelineLogData) => {
    console.log(JSON.stringify(data, null, 2));
  };

  streamPipelineStatus(
    credential,
    pipelineName,
    pipelineExecutionId,
    onStreamPrint
  );
}

async function testStreamBuildLogs() {
  const credential = await assumeRole();
  const externalExecutionId =
    "demo-static-site-build:7f3accaa-74a0-4d7d-b60f-f5ee59c6ad12";
  const onStreamPrint = (data: BuildingLogData) => {
    console.log(JSON.stringify(data, null, 2));
  };

  streamBuildLogs(credential, externalExecutionId, onStreamPrint);
}

await testStreamPipelineStatus();
// await testStreamBuildLogs();
