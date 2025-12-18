import { serviceURL } from "./services";
import { type PipelineExecutionSummary } from "@aws-sdk/client-codepipeline";
import { type PipelineExecutionStatus } from "@aws-sdk/client-codepipeline";

type BackendPipelineExecutionSummary = Omit<
  PipelineExecutionSummary,
  "lastUpdateTime" | "startTime"
> &
  Record<"lastUpdateTime" | "startTime", string>;

async function fetchDeployments(id: string | undefined) {
  const urlToFetch = `${serviceURL}${id}/deploys`;

  if (!id) {
    return;
  }

  try {
    const response = await fetch(urlToFetch, {
      method: "GET",
    });

    const result: BackendPipelineExecutionSummary[] = await response.json();

    return result;
  } catch (err) {
    console.error(err);
  }
}

export { fetchDeployments };
export type { BackendPipelineExecutionSummary };
