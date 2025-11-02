import express from "express";
import { deployStaticSite } from "@/services/deploymentService/staticWebsite/staticWebsite-deploy.js";
import type { DeployStaticSiteInput } from "@/services/deploymentService/staticWebsite/staticWebsite-deploy.js";
import { getErrorMessage } from "@/utils/errors.js";
import { assumeRole } from "@/services/assumeRoleService.js";
import { uploadDirToS3 } from "@/services/deploymentService/staticWebsite/staticWebsite-upload.js";

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

export default router;
