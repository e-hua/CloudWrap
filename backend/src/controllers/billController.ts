import express from "express";
import { Granularity, type ResultByTime } from "@aws-sdk/client-cost-explorer";

import { assumeRole } from "@/services/assumeRoleService.js";
import { getCostAndUsage } from "@/services/billService/costService.js";
import { FileCache } from "@/utils/FileCache.js";
import { getErrorMessage } from "@/utils/errors.js";

function isString(val: unknown): val is string {
  return typeof val === "string";
}

function isValidGranularity(val: string): val is Granularity {
  const validGranularities: string[] = Object.values(Granularity);
  return validGranularities.includes(val);
}

// 24h for time to live
const costCache = new FileCache<ResultByTime[]>(
  "cost",
  2 * 24 * 60 * 60 * 1000
);
await costCache.init();

const router = express.Router();

// granularity = "MONTHLY" || "DAILY"
// recordTypes = "Usage,Credit,Refund..."
// services = "Amazon Elastic Compute Cloud - Compute,Amazon Simple Storage Service..."
router.get("/cost", async (req, res) => {
  try {
    const credential = await assumeRole();
    const { granularity, recordTypes } = req.query;

    let finalGranularity: Granularity = Granularity.MONTHLY;

    if (isString(granularity) && isValidGranularity(granularity)) {
      finalGranularity = granularity;
    } else if (!granularity) {
      throw new Error(
        `Parameter 'granularity' (${granularity}) is invalid. Must be one of: ${Object.values(
          Granularity
        ).join(", ")}`
      );
    }

    if (!isString(recordTypes)) {
      throw new Error("granularity is not a proper string");
    }

    const filterOptions = {
      recordTypes: recordTypes.split(",") || ["Usage"],
    };

    // Cache key based on query alone
    const key = `cost_${granularity}_${filterOptions.recordTypes.join("_")}`;

    let costs: ResultByTime[] | undefined = await costCache.get(key);
    if (!costs) {
      costs = await getCostAndUsage(
        credential,
        finalGranularity,
        filterOptions
      );
      await costCache.put(key, costs);
    }

    res.status(200).json(costs);
  } catch (err) {
    res.status(500).json({ err: getErrorMessage(err) });
  }
});

export default router;
