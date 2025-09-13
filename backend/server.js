import express from "express";
import s3Router from "./controllers/s3Controller.js";
const PORT = process.env.PORT || 8080;

const app = express();

app.get("/health", (req, res) => {
  res.send("Hello, CloudWrap!");
});

app.listen(PORT, () => {
  console.log(`Backend up and running on port ${PORT} + CD is online!`);
});

app.use("/s3", s3Router);
