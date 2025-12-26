import { serviceReader } from "@/db";
import { assumeRole } from "@/services/assumeRoleService";
import { BuildingLogData, PipelineLogData, streamBuildLogs, streamPipelineStatus } from "@/services/deploymentService/pipelines/logs";
import { getPipelineHistory } from "@/services/deploymentService/pipelines/pipelines";
import { manualDeploy } from "@/services/deploymentService/pipelines/trigger-deployment";
import { getErrorMessage } from "@/utils/errors";
import { ipcMain } from "electron";
import z from "zod";
import { fromZodError } from "zod-validation-error";

const service_id_paramSchema = z.object({
  id: z.coerce.number().int().positive()
})

const {readServiceById } = serviceReader;

function setupDeployHandler() {
  ipcMain.handle("deploys:list", async (_, serviceNumber) => {
    const idParseResult = service_id_paramSchema.safeParse({id: serviceNumber});

    try {
      if (!idParseResult.success) {
          throw fromZodError(idParseResult.error)
      }

      const { id } = idParseResult.data;
      const service = readServiceById(id)
      if (!service) {
        throw new Error(`Service with id: ${id} not found`);
      }
  
      const pipelineName = `${service.name}-pipeline`
      const credentials = await assumeRole()
      const deployHistory = await getPipelineHistory(credentials, pipelineName)
      return { success: true, data: deployHistory } ;
    } catch(err) {
      console.error(err);
      return { success: false, error: getErrorMessage(err) };
    }
  })

  ipcMain.handle("deploys:trigger", async (_, serviceNumber) => {
    const idParseResult = service_id_paramSchema.safeParse({id: serviceNumber});

    try {
      if (!idParseResult.success) {
          throw fromZodError(idParseResult.error)
      }

      const { id } = idParseResult.data;
      const service = readServiceById(id)
      if (!service) {
        throw new Error(`Service with id: ${id} not found`);
      }
  
      const pipelineName = `${service.name}-pipeline`
      const credentials = await assumeRole()
      const deployResponse = await manualDeploy(credentials, pipelineName)
      return { success: true, data: deployResponse } ;
    } catch(err) {
      console.error(err);
      return { success: false, error: getErrorMessage(err) };
    }
  })

  ipcMain.handle("deploys:stream-statuses", async (event, {serviceNumber, executionId}) => {
    const channel = `deploys-internal:execution-${executionId}`; 

    const pipelineLogCallback = (elem: PipelineLogData) => {
      console.log(elem.data);
      event.sender.send(channel, elem)
    };


    try {
      const service = readServiceById(serviceNumber)
      if (!service) {
        throw new Error(`Service with id: ${serviceNumber} not found`);
      }

      const credentials = await assumeRole()
      const pipelineName = `${service.name}-pipeline`
      await streamPipelineStatus(credentials, pipelineName, executionId, pipelineLogCallback)

      pipelineLogCallback({ source: 'sys-info', data: 'All deployment statuses updated successfully!'});
      event.sender.send(channel, {end: true})
    } catch(err) {
      console.error(err);
      event.sender.send(channel, { source: 'sys-failure', data: getErrorMessage(err)});
    }
  })

  ipcMain.handle("deploys:stream-build", async (event, {buildId}) => {
    const channel = `deploys-internal:build-${buildId}`; 

    const buildingLogCallback = (elem: BuildingLogData) => {
      console.log(elem.data);
      event.sender.send(channel, elem)
    };

    try {
      const credentials = await assumeRole()
      await streamBuildLogs(credentials, buildId, buildingLogCallback)
      buildingLogCallback({ source: 'sys-info', data: 'All building logs sent successfully!'});
      event.sender.send(channel, {end: true})
    } catch(err) {
      console.error(err);
      event.sender.send(channel, { source: 'sys-failure', data: getErrorMessage(err)});
    }
  })
}

export default setupDeployHandler;