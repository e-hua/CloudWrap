import express from "express"
import {z} from "zod";
import {sseMiddleware} from "@/middleware/sse.middleware.js";
import {fromZodError} from "zod-validation-error";
import {serviceReader} from "@/db/index.js";
import {getErrorMessage} from "@/utils/errors.js";
import {getPipelineHistory} from "@/services/deploymentService/pipelines/pipelines.js";
import {assumeRole} from "@/services/assumeRoleService.js";
import {manualDeploy} from "@/services/deploymentService/pipelines/trigger-deployment.js";
import {
  type BuildingLogData,
  type PipelineLogData, streamBuildLogs,
  streamPipelineStatus
} from "@/services/deploymentService/pipelines/logs.js";

const {readServiceById, readServicesByFilter} = serviceReader;

// This enables us to retrieve the url params from the
const router = express.Router({mergeParams: true})

const service_id_paramSchema = z.object({
  id: z.coerce.number().int().positive()
})

const execution_id_paramSchema = z.object({
  execution_id: z.coerce.string()
})

const build_id_paramSchema = z.object({
  build_id: z.coerce.string()
})

// Listing the deployment history of the service with certain id
// GET: /services/{id}/deploys

router.get("/", async (req, res) => {
  // Note that now we can retrieve the service_name from the DB
  // And derive the pipeline_name: `${service_name}-pipeline`
  const result = service_id_paramSchema.safeParse(req.params)
  if (!result.success) {
    return res.status(400).json({ err: fromZodError(result.error) });
  }

  const { id } = result.data;

  try {
    const service = readServiceById(id)
    if (!service) {
      return res.status(404).json({ err: `Service with id: ${id} not found` });
    }

    const pipelineName = `${service.name}-pipeline`
    const credentials = await assumeRole()
    const deployHistory = await getPipelineHistory(credentials, pipelineName)
    res.status(200).send(deployHistory)
  } catch(err) {
    res.status(500).json({ err: getErrorMessage(err) });
  }
})

// Trigger the deployment pipeline of the service with certain id
// POST: /services/{id}/deploys

router.post("/", async (req, res) => {
  const result = service_id_paramSchema.safeParse(req.params)
  if (!result.success) {
    return res.status(400).json({ err: fromZodError(result.error) });
  }

  const { id } = result.data;
  try {
    const service = readServiceById(id)
    if (!service) {
      return res.status(404).json({ err: `Service with id: ${id} not found` });
    }

    const pipelineName = `${service.name}-pipeline`
    const credentials = await assumeRole()
    const deployResponse = await manualDeploy(credentials, pipelineName)
    res.status(200).send(deployResponse)
  } catch(err) {
    res.status(500).json({ err: getErrorMessage(err) });
  }
})

// Stream the execution status of the stages of a specific deployment (powered by AWS CodePipeline)
// GET: /services/{id}/deploys/{execution_id}
router.get("/:execution_id", sseMiddleware, async (req, res) => {
  const result = service_id_paramSchema.safeParse(req.params)
  if (!result.success) {
    return res.sseError({ message: fromZodError(result.error) });
  }
  const { id } = result.data;

  const parse_execution_id_result = execution_id_paramSchema.safeParse(req.params)
  if (!parse_execution_id_result.success) {
    return res.sseError({ message: fromZodError(parse_execution_id_result.error) });
  }
  const { execution_id } = parse_execution_id_result.data;

  const pipelineLogCallback = (elem: PipelineLogData) => {
    console.log(elem.data);
    res.sseWrite(elem);
  };

  try {
    const service = readServiceById(id)
    if (!service) {
      return res.sseError({ message: `Service with id: ${id} not found` });
    }

    const credentials = await assumeRole()
    const pipelineName = `${service.name}-pipeline`
    await streamPipelineStatus(credentials, pipelineName, execution_id, pipelineLogCallback)

    res.sseEnd({ message: "All deployment status updated successful!" });
  } catch(err) {
    res.sseError({ message: getErrorMessage(err) });
  }
})

// Stream the detailed logs of a building process (powered by AWS CodeBuild)
// GET: /services/{id}/deploys/builds/{build_id}
router.get("/builds/:build_id", sseMiddleware, async (req, res) => {
  const parse_build_id_result = build_id_paramSchema.safeParse(req.params)
  if (!parse_build_id_result.success) {
    return res.sseError({ message: fromZodError(parse_build_id_result.error) });
  }
  const { build_id } = parse_build_id_result.data;

  const buildingLogCallback = (elem: BuildingLogData) => {
    console.log(elem.data);
    res.sseWrite(elem);
  };

  try {
    const credentials = await assumeRole()
    await streamBuildLogs(credentials, build_id, buildingLogCallback)

    res.sseEnd({ message: "All building logs sent successful!" });
  } catch(err) {
    res.sseError({ message: getErrorMessage(err) });
  }
})


export default router