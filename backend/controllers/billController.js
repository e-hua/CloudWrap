import express from "express";

import assumeRole from "../services/assumeRoleService.js";
import { getCostAndUsage } from "../services/billService/costService.js";
import { FileCache } from "../utils/FileCache.js";

// 24h for time to live
const costCache = new FileCache("cost", 24 * 60 * 60 * 1000);
await costCache.init();

const router = express.Router();

// granularity = "MONTHLY" || "DAILY"
// recordTypes = "Usage,Credit,Refund..."
// services = "Amazon Elastic Compute Cloud - Compute,Amazon Simple Storage Service..."
router.get("/cost", async (req, res) => {
  try {
    const ARN = req.headers.ARN || process.env.USER_ROLE_ARN;
    const credential = await assumeRole(ARN);

    const { granularity = "MONTHLY", recordTypes, services } = req.query;
    const filterOptions = {
      recordTypes: recordTypes?.split(",") ?? ["Usage"],
      services: services?.split(","),
    };

    // Cache key based on query alone
    const key = `cost_${granularity}_${filterOptions.recordTypes.join("_")}_${(
      filterOptions.services || []
    ).join("_")}`;

    let costs = await costCache.get(key);
    if (!costs) {
      costs = await getCostAndUsage(credential, granularity, filterOptions);
      await costCache.put(key, costs);
    }

    res.status(200).json(costs);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

export default router;
