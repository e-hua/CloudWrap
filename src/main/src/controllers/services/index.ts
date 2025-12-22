import express from "express";
import { z } from "zod";
import {
  createStaticSite,
  type CreateStaticSiteDeps,
} from "@/services/deploymentService/static-site/create.js";
import { getErrorMessage } from "@/utils/errors.js";
import {
  createServer,
  type CreateServerInput,
} from "@/services/deploymentService/ECS-on-EC2/create.js";
import {
  runTofu,
  runTofuAndCollect,
  type StreamData,
} from "@/services/deploymentService/runTofu.js";
import { sseMiddleware } from "@/middleware/sse.middleware.js";
import {
  type DBServiceQueryFilter,
  dbServiceQueryFilterSchema,
} from "@/db/queries/Services/Services.schema.js";
import type { DBServiceType } from "@/db/queries/Services/Services.types.js";
import {
  serviceReader,
  serviceDeleter,
  serviceCreator,
  serviceUpdater,
} from "@/db/index.js";
import { fromZodError } from "zod-validation-error";
import {
  type CreateServicePayload,
  createServicePayloadSchema,
  type DeleteServicePayload,
  deleteServicePayloadSchema,
  type UpdateServicePayload,
  updateServicePayloadSchema,
} from "@/services/deploymentService/deployment.schema.js";
import {
  updateStaticSite,
  type UpdateStaticSiteDeps,
} from "@/services/deploymentService/static-site/update.js";
import { updateServer } from "@/services/deploymentService/ECS-on-EC2/update.js";
import {
  deleteStaticSite,
  type DeleteStaticSiteDeps,
} from "@/services/deploymentService/static-site/delete.js";
import { deleteServer } from "@/services/deploymentService/ECS-on-EC2/delete.js";
import { mkdtemp, rm } from "fs/promises";
import { copy } from "fs-extra";
import { tmpdir } from "os";
import { manualDeploy } from "@/services/deploymentService/pipelines/trigger-deployment.js";
import { assumeRole } from "@/services/assumeRoleService.js";
import { randomBytes } from "crypto";

import deployRouter from "./deployController.js";

const router = express.Router();
const { readServiceById, readServicesByFilter } = serviceReader;

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Listing all services base on the filters in the query params
// GET: /services?names=foo&names=bar&groupIds=123
router.get("/", (req, res) => {
  try {
    // Using ZOD schemas to safely parse the filter from the request
    const filterResult = dbServiceQueryFilterSchema.safeParse(req.query);

    // Invalid input
    if (!filterResult.success) {
      return res.status(400).json({ err: fromZodError(filterResult.error) });
    }

    const filter: DBServiceQueryFilter = filterResult.data;
    const services: DBServiceType[] = readServicesByFilter(filter);

    res.status(200).send(services);
  } catch (err) {
    res.status(500).json({ err: getErrorMessage(err) });
  }
});

// Listing service with specific id
// GET: /services/{id}
router.get("/:id", (req, res) => {
  try {
    const idParseResult = idParamSchema.safeParse(req.params);
    if (!idParseResult.success) {
      res.status(400).json({ err: fromZodError(idParseResult.error) });
      return;
    }

    const { id } = idParseResult.data;
    const service = readServiceById(id);

    if (!service) {
      return res.status(404).json({ err: `Service with id: ${id} not found` });
    }

    res.status(200).send(service);
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: getErrorMessage(err) });
  }
});

// Create service with given information
// POST: /services
// Notice that we need to use SSE middleware to send all the logs here
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

router.post("/", sseMiddleware, async (req, res) => {
  const logCallback = (elem: StreamData) => {
    console.log(elem.data);
    res.sseWrite(elem);
  };

  try {
    const createServiceRequestResult = createServicePayloadSchema.safeParse(
      req.body
    );
    if (!createServiceRequestResult.success) {
      res.sseError({ message: fromZodError(createServiceRequestResult.error) });
      return;
    }
    const createServicePayload: CreateServicePayload =
      createServiceRequestResult.data;

    if (createServicePayload.type === "static-site") {
      await createStaticSite(
        {
          inputs: createServicePayload,
          onStreamCallback: logCallback,
        },
        createServiceDeps
      );
    } else {
      await createServer(
        {
          inputs: createServicePayload,
          onStreamCallback: logCallback,
        },
        createServiceDeps
      );
    }

    res.sseEnd({ message: "Server deployment successful!" });
  } catch (err) {
    res.sseError({ message: getErrorMessage(err) });
  }
});

// Update service according to the id in the path params
// PATCH: /services/{id}
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

router.patch("/:id", sseMiddleware, async (req, res) => {
  const logCallback = (elem: StreamData) => {
    console.log(elem.data);
    res.sseWrite(elem);
  };

  try {
    const idParseResult = idParamSchema.safeParse(req.params);
    if (!idParseResult.success) {
      res.sseError({ message: fromZodError(idParseResult.error) });
      return;
    }

    const { id } = idParseResult.data;

    console.log(req.body);
    const updateServiceRequestResult = updateServicePayloadSchema.safeParse(
      req.body
    );
    if (!updateServiceRequestResult.success) {
      res.sseError({ message: fromZodError(updateServiceRequestResult.error) });
      return;
    }
    const updateServicePayload: UpdateServicePayload =
      updateServiceRequestResult.data;

    if (updateServicePayload.type === "static-site") {
      await updateStaticSite(
        {
          service_id: id,
          inputs: updateServicePayload,
          onStreamCallback: logCallback,
        },
        updateServiceDeps
      );
    } else {
      await updateServer(
        {
          service_id: id,
          inputs: updateServicePayload,
          onStreamCallback: logCallback,
        },
        updateServiceDeps
      );
    }

    res.sseEnd({ message: "Server deployment successful!" });
  } catch (err) {
    console.error(err);
    res.sseError({ message: getErrorMessage(err) });
  }
});

// Delete service with that id
// DELETE: /services/{id}
const deleteServiceDeps = {
  serviceReader,
  serviceDeleter,
  runTofu,
  mkdtemp,
  copy,
  rm,
  tmpdir,
};

router.delete("/:id", sseMiddleware, async (req, res) => {
  const logCallback = (elem: StreamData) => {
    console.log(elem.data);
    res.sseWrite(elem);
  };

  try {
    const idParseResult = idParamSchema.safeParse(req.params);
    if (!idParseResult.success) {
      res.sseError({ message: fromZodError(idParseResult.error) });
      return;
    }
    const { id } = idParseResult.data;

    // Expect to see "type" and "githubConnectionArn" attribute in the request body
    const deleteServiceRequestResult = deleteServicePayloadSchema.safeParse(
      req.body
    );
    if (!deleteServiceRequestResult.success) {
      res.sseError({ message: fromZodError(deleteServiceRequestResult.error) });
      return;
    }
    const deleteServicePayload: DeleteServicePayload =
      deleteServiceRequestResult.data;

    if (deleteServicePayload.type === "static-site") {
      await deleteStaticSite(
        {
          service_id: id,
          githubConnectionArn: deleteServicePayload.githubConnectionArn,
          onStreamCallback: logCallback,
        },
        deleteServiceDeps
      );
    } else {
      await deleteServer(
        {
          service_id: id,
          githubConnectionArn: deleteServicePayload.githubConnectionArn,
          onStreamCallback: logCallback,
        },
        deleteServiceDeps
      );
    }

    res.sseEnd({ message: "Server deployment successful!" });
  } catch (err) {
    console.error(err);
    res.sseError({ message: getErrorMessage(err) });
  }
});

router.use("/:id/deploys", deployRouter);

export default router;
