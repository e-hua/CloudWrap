import { serviceCreator, serviceDeleter, serviceReader, serviceUpdater } from "@/db";
import { DBServiceQueryFilter, dbServiceQueryFilterSchema } from "@/db/queries/Services/Services.schema";
import { createServicePayloadSchema, deleteServicePayloadSchema, updateServicePayloadSchema } from "@/services/deploymentService/deployment.schema";
import { createServer } from "@/services/deploymentService/ECS-on-EC2/create";
import { runTofu, runTofuAndCollect, StreamData } from "@/services/deploymentService/runTofu";
import { createStaticSite } from "@/services/deploymentService/static-site/create";
import { getErrorMessage } from "@/utils/errors";
import { ipcMain } from "electron";
import z from "zod";
import { fromZodError } from "zod-validation-error";
import { mkdtemp, rm } from "fs/promises";
import { copy } from "fs-extra";
import { tmpdir } from "os";
import { randomBytes } from "crypto";
import { manualDeploy } from "@/services/deploymentService/pipelines/trigger-deployment";
import { assumeRole } from "@/services/assumeRoleService";
import { updateStaticSite } from "@/services/deploymentService/static-site/update";
import { updateServer } from "@/services/deploymentService/ECS-on-EC2/update";
import { deleteServer } from "@/services/deploymentService/ECS-on-EC2/delete";
import { deleteStaticSite } from "@/services/deploymentService/static-site/delete";
import { DBServiceType } from "@/db/queries/Services/Services.types";

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
const { readServiceById, readServicesByFilter } = serviceReader;

function setupServiceHandler() {

  // This is to prevent the user from spinning up multiple runTofu instances 
  const activeChannels = new Set<string>();

  ipcMain.handle("services:list", async (_, filterParams) => {
    try {
      const filterResult = dbServiceQueryFilterSchema.safeParse(filterParams);
      if (!filterResult.success) {
        throw fromZodError(filterResult.error)
      }

      const filter: DBServiceQueryFilter = filterResult.data;
      const services: DBServiceType[] = readServicesByFilter(filter);

      return { success: true, data: services };
    } catch (err) {
      return { success: false, error: getErrorMessage(err) };
    }
  })

  ipcMain.handle("services:get", async (_, serviceNumber) => {
    try {
      const idParseResult = idParamSchema.safeParse({id: serviceNumber});
      if (!idParseResult.success) {
          throw fromZodError(idParseResult.error)
      }

      const { id } = idParseResult.data;
      const service = readServiceById(id);

      if (!service) {
        throw new Error(`Service with id: ${id} not found`)
      }

      return { success: true, data: service } ;
    } catch (err) {
      console.error(err);
      return { success: false, error: getErrorMessage(err) };
    }
  })  

  const createServiceDeps = {
    serviceCreator,
    runTofu,
    runTofuAndCollect,
    mkdtemp,
    copy,
    rm,
    tmpdir,
    randomBytes,
  };

  ipcMain.handle('services:stream-create', async (event, payload) => {
    const channel = `services-internal:create-log`; 
    if (activeChannels.has(channel)) {
      console.log(`Channel ${activeChannels} is already in progress.`);
      return;
    }
    activeChannels.add(channel)
  
    const logCallback = (elem: StreamData) => {
      console.log(elem.data);
      event.sender.send(channel, elem)
    };

    try {
      const parsedResult = createServicePayloadSchema.safeParse(payload);

      if (!parsedResult.success) {
        throw fromZodError(parsedResult.error);
      } 

      const parsed = parsedResult.data;
      if (parsed.type === "static-site") {
        await createStaticSite({ inputs: parsed, onStreamCallback: logCallback }, createServiceDeps);
      } else {
        await createServer({ inputs: parsed, onStreamCallback: logCallback }, createServiceDeps);
      }

      logCallback({ source: 'sys-info', data: 'Service deployed successfully!'});
      event.sender.send(channel, {end: true})
    } catch (err) {
      console.error(err);
      event.sender.send(channel, { source: 'sys-failure', data: getErrorMessage(err), end: true});
    } finally {
      activeChannels.delete(channel)
    }
  });

  const updateServiceDeps = {
    serviceUpdater,
    serviceReader,
    runTofu,
    runTofuAndCollect,
    mkdtemp,
    copy,
    rm,
    tmpdir,
    manualDeploy,
    assumeRole,
  };

  ipcMain.handle('services:stream-update', async (event, {id, payload}) => {
    const channel = `services-internal:${id}-update-log`; 

    if (activeChannels.has(channel)) {
      console.log(`Channel ${activeChannels} is already in progress.`);
      return;
    }
    activeChannels.add(channel)
    
    const logCallback = (elem: StreamData) => {
      console.log(elem.data);
      event.sender.send(channel, elem)
    }; 

    try {
      const parsedResult = updateServicePayloadSchema.safeParse(payload);

      if (!parsedResult.success) {
        throw fromZodError(parsedResult.error);
      } 

      const parsed = parsedResult.data;

      const {id: service_id} = idParamSchema.parse({id});

      if (parsed.type === "static-site") {
        await updateStaticSite({service_id, inputs: parsed, onStreamCallback: logCallback }, updateServiceDeps);
      } else {
        await updateServer({service_id, inputs: parsed, onStreamCallback: logCallback }, updateServiceDeps);
      }

      logCallback({ source: 'sys-info', data: 'Server updated successfully!'});
      event.sender.send(channel, {end: true})
    } catch (err) {
      console.error(err);
      event.sender.send(channel, { source: 'sys-failure', data: getErrorMessage(err), end: true});
    } finally {
      activeChannels.delete(channel)
    }
  });

  const deleteServiceDeps = {
    serviceReader,
    serviceDeleter,
    runTofu,
    mkdtemp,
    copy,
    rm,
    tmpdir,
  };

  ipcMain.handle('services:stream-delete', async (event, {id, payload}) => {
    const channel = `services-internal:${id}-delete-log`; 

    if (activeChannels.has(channel)) {
      console.log(`Channel ${activeChannels} is already in progress.`);
      return;
    }
    activeChannels.add(channel)
    
    const logCallback = (elem: StreamData) => {
      console.log(elem.data);
      event.sender.send(channel, elem)
    };

    try {
      const parsedResult = deleteServicePayloadSchema.safeParse(payload);

      if (!parsedResult.success) {
        throw fromZodError(parsedResult.error);
      } 

      const parsed = parsedResult.data;
      const {id: service_id} = idParamSchema.parse({id});

      if (parsed.type === "static-site") {
        await deleteStaticSite({service_id, githubConnectionArn: parsed.githubConnectionArn, onStreamCallback: logCallback }, deleteServiceDeps);
      } else {
        await deleteServer({service_id, githubConnectionArn: parsed.githubConnectionArn, onStreamCallback: logCallback }, deleteServiceDeps);
      }

      logCallback({ source: 'sys-info', data: 'Service deleted successfully!'});
      event.sender.send(channel, {end: true})
    } catch (err) {
      console.error(err);
      event.sender.send(channel, { source: 'sys-failure', data: getErrorMessage(err), end: true});
    } finally {
      activeChannels.delete(channel)
    }
  });
}

export default setupServiceHandler;