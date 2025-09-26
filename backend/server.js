import express from "express";
import s3Router from "./controllers/s3Controller.js";
import cors from "cors";

const PORT = process.env.PORT || 8080;

const app = express();

app.get("/health", (req, res) => {
  res.send("Hello, CloudWrap!");
});

app.listen(PORT, () => {
  console.log(`Backend up and running on port ${PORT} + CD is online!`);
});

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use("/s3", s3Router);
