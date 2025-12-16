import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import s3Router from "@/controllers/s3Controller.js";
import ec2Router from "@/controllers/ec2Controller.js";
import billRouter from "@/controllers/billController.js";
import serviceRouter from "@/controllers/services/index.js";
import testSSERouter from "@/controllers/testSSEController.js";

const app = express();

app.get("/health", (_: Request, res: Response) => {
  res.send("Hello, CloudWrap!");
});

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

app.use(express.json());
app.use("/s3", s3Router);
app.use("/ec2", ec2Router);
app.use("/bill", billRouter);
app.use("/services", serviceRouter);
app.use("/testSSE", testSSERouter);

export default app;
