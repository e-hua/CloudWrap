import { sseMiddleware } from "@/middleware/sse.middleware.js";
import { sleep } from "@/utils/sleep.js";
import express from "express";

const router = express.Router();

router.get("/", sseMiddleware, async (req, res) => {
  let connectionClosed = false;
  req.on("close", () => {
    connectionClosed = true;
  });

  const logCallback = () => {
    const currDate = new Date();
    console.log(currDate);
    res.sseWrite(currDate);
  };

  while (!connectionClosed) {
    logCallback();
    await sleep(500);
  }
});

export default router;
