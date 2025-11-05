import express from "express";
import { deployStaticSite } from "@/services/deploymentService/static-site/deploy.js";
import type { DeployStaticSiteInput } from "@/services/deploymentService/static-site/deploy.js";
import { getErrorMessage } from "@/utils/errors.js";
import { assumeRole } from "@/services/assumeRoleService.js";
import { uploadDirToS3 } from "@/services/deploymentService/static-site/upload.js";
import {
  deployECS,
  type DeployECSInput,
} from "@/services/deploymentService/ECS-on-EC2/deploy.js";

const router = express.Router();

router.post("/static-website", async (req, res) => {
  try {
    const logCallback = (elem: any) => console.log(elem.data);
    const credentials = await assumeRole();
    const input: DeployStaticSiteInput = { ...req.body };
    await deployStaticSite(input, logCallback);

    const { projectRootPath, siteBucketName } = req.body;
    await uploadDirToS3({
      projectPath: projectRootPath,
      currentPath: projectRootPath,
      bucketName: siteBucketName,
      onStream: logCallback,
      credentials: credentials,
    });
    logCallback({ source: "sys-info", data: "All files uploaded!" });
    res
      .status(202)
      .json({ message: "Deployment started. See logs for progress." });
  } catch (err) {
    res.status(500).json({ message: getErrorMessage(err) });
  }
});

router.post("/ecs_on_ec2", async (req, res) => {
  try {
    const logCallback = (elem: any) => console.log(elem.data);
    const input: DeployECSInput = { ...req.body };
    await deployECS(input, logCallback);

    res
      .status(202)
      .json({ message: "Deployment started. See logs for progress." });
  } catch (err) {
    res.status(500).json({ message: getErrorMessage(err) });
  }
});

export default router;
