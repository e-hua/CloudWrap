import { assumeRole } from "@/services/assumeRoleService.js";
import { getPipelineHistory, listAllPipelines } from "../pipelines.js";

async function main() {
  try {
    const credential = await assumeRole();

    const projectPipelines = await listAllPipelines(credential);

    console.log(projectPipelines);

    const pipelineName = "demo-static-site";
    const pipelineHistory = await getPipelineHistory(credential, pipelineName);
    console.log(pipelineHistory);
    console.log("\n--- TEST List Project Pipelines SUCCEEDED ---");
  } catch (error) {
    console.error(error);
    console.error("\n--- TEST List Project Pipelines FAILED ---");
  }
}

main();
