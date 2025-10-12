import express from "express";

import assumeRole from "../services/assumeRoleService.js";
import { getCostAndUsage } from "../services/billService/costService.js";

const router = express.Router();

router.get("/cost", async (req, res) => {
  try {
    const ARN = req.headers.ARN || process.env.USER_ROLE_ARN;
    const credential = await assumeRole(ARN);

    const { granularity = "MONTHLY", recordTypes, services } = req.query;
    const filterOptions = {
      recordTypes: recordTypes?.split(",") ?? ["Usage"],
      services: services?.split(","),
    };

    const costs = await getCostAndUsage(credential, granularity, filterOptions);
    res.status(200).send(costs);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

export default router;
