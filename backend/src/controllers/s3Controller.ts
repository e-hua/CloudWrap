import express from "express";
import multer from "multer";

import { assumeRole } from "@/services/assumeRoleService.js";
import {
  addBucket,
  deleteBucket,
  listBuckets,
} from "@/services/s3Services/s3BucketService.js";
import {
  deleteObject,
  getObject,
  listObjects,
  putObject,
} from "@/services/s3Services/s3ObjectService.js";
import { getErrorMessage } from "@/utils/errors.js";

const router = express.Router();
const upload = multer();

// Bucket controllers first

// List buckets

router.get("/buckets", async (req, res) => {
  // We can also use req.header("key") to access the attributes

  try {
    const credential = await assumeRole();
    const buckets = await listBuckets(credential);

    res.status(200).send(buckets.Buckets);
  } catch (error) {
    res.status(500).json({ err: getErrorMessage(error) });
  }
});

// Add buckets
router.post("/buckets/:bucketName", async (req, res) => {
  try {
    const ARN = req.headers.ARN || process.env.USER_ROLE_ARN;
    const { bucketName } = req.params;

    const credential = await assumeRole();
    await addBucket(credential, bucketName);

    res.status(201).json({ message: "Bucket created successfully" });
  } catch (error) {
    res.status(500).json({ err: getErrorMessage(error) });
  }
});

// Delete buckets
router.delete("/buckets/:bucketName", async (req, res) => {
  try {
    const { bucketName } = req.params;

    const credential = await assumeRole();
    await deleteBucket(credential, bucketName);
    res.status(204).json({ message: "Bucket deleted successfully" });
  } catch (error: unknown) {
    res.status(500).json({ err: getErrorMessage(error) });
  }
});

// List objects in a bucket
router.get("/buckets/:bucketName", async (req, res) => {
  try {
    const { bucketName } = req.params;

    const credential = await assumeRole();
    const objects = await listObjects(credential, bucketName);
    res.status(200).send(objects);
  } catch (error) {
    res.status(500).json({ err: getErrorMessage(error) });
  }
});

// Put single file in a bucket
router.post(
  "/buckets/:bucketName/:itemName",
  // Some middleware
  upload.single("file"),
  async (req, res) => {
    try {
      const { bucketName, itemName } = req.params;

      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      if (!bucketName) {
        res.status(400).json({ error: "Bucket name not set" });
        return;
      }

      if (!itemName) {
        res.status(400).json({ error: "Item name not set" });
        return;
      }

      const file = req.file.buffer;
      const fileType = req.file.mimetype;

      const credential = await assumeRole();

      await putObject(credential, bucketName, itemName, file, fileType);
      res.status(201).send({ message: "Item uploaded successfully" });
    } catch (error) {
      res.status(500).json({ err: getErrorMessage(error) });
    }
  }
);

router.delete("/buckets/:bucketName/:itemName", async (req, res) => {
  try {
    const { bucketName, itemName } = req.params;

    const credential = await assumeRole();
    await deleteObject(credential, bucketName, itemName);
    res.status(204).send({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(400).json({ err: getErrorMessage(error) });
  }
});

router.get("/buckets/:bucketName/:itemName", async (req, res) => {
  try {
    const { bucketName, itemName } = req.params;

    const credential = await assumeRole();
    const file = await getObject(credential, bucketName, itemName);
    res.status(200).send(file);
  } catch (error) {
    res.status(400).json({ err: getErrorMessage(error) });
  }
});

export default router;
