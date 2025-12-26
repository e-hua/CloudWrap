import {
  type PipelineExecutionSummary,
} from "@aws-sdk/client-codepipeline";

type BackendPipelineExecutionSummary = Omit<
  PipelineExecutionSummary,
  "lastUpdateTime" | "startTime"
> &
  Record<"lastUpdateTime" | "startTime", string>;

async function fetchDeployments(id: string | undefined) {
  if (!id) {
    return;
  }

  try {
    const response = await window.api.deploys.list(id)
    if (response.success) {
      const result = response.data || []
      return result;
    } else {
      throw new Error(`Main thread error: ${response.error}`)
    }
  } catch (error) {
    console.error(error);
    return undefined
  }
}

async function reDeploy(id: string | undefined) {
  if (!id) {
    return;
  }

  try {
    const response = await window.api.deploys.trigger(id)
    if (response.success) {
      const result = response.data
      return result;
    } else {
      throw new Error(`Main thread error: ${response.error}`)
    }
  } catch (error) {
    console.error(error);
    return undefined
  }
}

export { fetchDeployments, reDeploy };
export type { BackendPipelineExecutionSummary };
