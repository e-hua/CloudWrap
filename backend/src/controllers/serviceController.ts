import express from "express";
import { createStaticSite } from "@/services/deploymentService/static-site/create.js";
import type { CreateStaticSiteInput } from "@/services/deploymentService/static-site/create.js";
import { getErrorMessage } from "@/utils/errors.js";
import {
  createECS,
  type CreateECSInput,
} from "@/services/deploymentService/ECS-on-EC2/create.js";
import type { StreamData } from "@/services/deploymentService/runTofu.js";
import { sseMiddleware } from "@/middleware/sse.middleware.js";

const router = express.Router();
router.use(sseMiddleware);

router.post("/static-website", async (req, res) => {
  const logCallback = (elem: StreamData) => {
    console.log(elem.data);
    res.sseWrite(elem);
  };

  try {
    const input: CreateStaticSiteInput = { ...req.body };
    await createStaticSite(input, logCallback);

    res.sseEnd({ message: "Site deployment successful!" });
  } catch (err) {
    res.sseError({ message: getErrorMessage(err) });
  }
});

router.post("/ecs_on_ec2", async (req, res) => {
  const logCallback = (elem: StreamData) => {
    console.log(elem.data);
    res.sseWrite(elem);
  };

  try {
    const input: CreateECSInput = { ...req.body };
    await createECS(input, logCallback);

    res.sseEnd({ message: "Server deployment successful!" });
  } catch (err) {
    res.sseError({ message: getErrorMessage(err) });
  }
});

export default router;
