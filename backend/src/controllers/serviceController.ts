import express from "express";
import {z} from "zod";
import { createStaticSite } from "@/services/deploymentService/static-site/create.js";
import { getErrorMessage } from "@/utils/errors.js";
import {
  createServer,
  type CreateServerInput,
} from "@/services/deploymentService/ECS-on-EC2/create.js";
import type { StreamData } from "@/services/deploymentService/runTofu.js";
import { sseMiddleware } from "@/middleware/sse.middleware.js";
import {type DBServiceQueryFilter, dbServiceQueryFilterSchema} from "@/db/queries/Services/Services.schema.js";
import type {DBServiceType} from "@/db/queries/Services/Services.types.js"
import {serviceReader} from "@/db/index.js";
import {fromZodError} from "zod-validation-error";
import {
  type CreateServicePayload,
  createServicePayloadSchema,
  type DeleteServicePayload,
  deleteServicePayloadSchema,
  type UpdateServicePayload,
  updateServicePayloadSchema,
} from "@/services/deploymentService/deployment.schema.js";
import {updateStaticSite} from "@/services/deploymentService/static-site/update.js";
import {updateServer} from "@/services/deploymentService/ECS-on-EC2/update.js";
import {deleteStaticSite} from "@/services/deploymentService/static-site/delete.js";
import {deleteServer} from "@/services/deploymentService/ECS-on-EC2/delete.js";

const router = express.Router();
const {readServiceById, readServicesByFilter} = serviceReader;

const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
})

// Listing all services base on the filters in the query params
// GET: /services?names=foo&names=bar&groupIds=123
router.get("/", (req, res) => {
  try {
    // Using ZOD schemas to safely parse the filter from the request
    const filterResult = dbServiceQueryFilterSchema.safeParse(req.query)

    // Invalid input
    if (!filterResult.success) {
      return res.status(400).json({ err: fromZodError(filterResult.error) });
    }

    const filter: DBServiceQueryFilter = filterResult.data
    const services : DBServiceType[] = readServicesByFilter(filter)

    res.status(200).send(services)
  } catch (err) {
    res.status(500).json({ err: getErrorMessage(err) });
  }
});

// Listing service with specific id
// GET: /services/{id}
router.get("/:id", (req, res) => {
  try {
    const idParseResult = idParamSchema.safeParse(req.params)
    if (!idParseResult.success) {
      res.status(400).json({ err: fromZodError(idParseResult.error) });
      return;
    }

    const { id } = idParseResult.data;
    const service = readServiceById(id)

    if (!service) {
      return res.status(404).json({ err: "Service not found" });
    }

    res.status(200).send(service)
  } catch (err) {
    res.status(500).json({ err: getErrorMessage(err) });
  }
});


// Create service with given information
// POST: /services
// Notice that we need to use SSE middleware to send all the logs here
router.post("/", sseMiddleware, async (req, res) => {
  const logCallback = (elem: StreamData) => {
    console.log(elem.data);
    res.sseWrite(elem);
  };

  try {
    const createServiceRequestResult = createServicePayloadSchema.safeParse(req.body)
    if (!createServiceRequestResult.success) {
      res.sseError({ message: fromZodError(createServiceRequestResult.error)  });
      return;
    }
    const createServicePayload: CreateServicePayload = createServiceRequestResult.data;

    if (createServicePayload.type === "static-site") {
      await createStaticSite(createServicePayload, logCallback)
    } else {
      await createServer(createServicePayload, logCallback)
    }

    res.sseEnd({ message: "Server deployment successful!" });
  } catch (err) {
    res.sseError({ message: getErrorMessage(err) });
  }
});

// Update service according to the id in the path params
// PATCH: /services/{id}
router.patch("/:id", sseMiddleware, async (req, res) => {
  const logCallback = (elem: StreamData) => {
    console.log(elem.data);
    res.sseWrite(elem);
  };

  try {
    const idParseResult = idParamSchema.safeParse(req.params)
    if (!idParseResult.success) {
      res.status(400).json({ err: fromZodError(idParseResult.error) });
      return;
    }

    const { id } = idParseResult.data;

    const updateServiceRequestResult = updateServicePayloadSchema.safeParse(req.body)
    if (!updateServiceRequestResult.success) {
      res.sseError({ message: fromZodError(updateServiceRequestResult.error)  });
      return;
    }
    const updateServicePayload: UpdateServicePayload = updateServiceRequestResult.data;

    if (updateServicePayload.type === "static-site") {
      await updateStaticSite(id, updateServicePayload, logCallback)
    } else {
      await updateServer(id, updateServicePayload, logCallback)
    }

    res.sseEnd({ message: "Server deployment successful!" });

  } catch(err) {
    res.sseError({ message: getErrorMessage(err) });
  }
})

// Delete service with that id
// DELETE: /services/{id}

router.delete("/:id", sseMiddleware, async (req, res) => {
  const logCallback = (elem: StreamData) => {
    console.log(elem.data);
    res.sseWrite(elem);
  };

  try {
    const idParseResult = idParamSchema.safeParse(req.params)
    if (!idParseResult.success) {
      res.status(400).json({ err: fromZodError(idParseResult.error) });
      return;
    }
    const { id } = idParseResult.data;

    // Expect to see "type" and "githubConnectionArn" attribute in the request body
    const deleteServiceRequestResult = deleteServicePayloadSchema.safeParse(req.body)
    if (!deleteServiceRequestResult.success)  {
      res.sseError({ message: fromZodError(deleteServiceRequestResult.error) });
      return
    }
    const deleteServicePayload: DeleteServicePayload = deleteServiceRequestResult.data;

    if (deleteServicePayload.type === "static-site") {
      await deleteStaticSite(id, deleteServicePayload.githubConnectionArn, logCallback)
    } else {
      await deleteServer(id, deleteServicePayload.githubConnectionArn, logCallback)
    }

    res.sseEnd({ message: "Server deployment successful!" });

  } catch(err) {
    res.sseError({ message: getErrorMessage(err) });
  }
})

export default router;
