import path from "path";
import fs from "fs/promises";
import mime from "mime-types";
import { putObject } from "@/services/s3Services/s3ObjectService.js";
import type { StrictCredentials } from "@/services/assumeRoleService.js";
import type { StreamData } from "../runTofu.js";

type UploadDirToS3Type = {
  projectPath: string;
  currentPath: string;
  bucketName: string;
  onStream: (data: StreamData) => void;
  credentials: StrictCredentials;
};

async function uploadDirToS3({
  projectPath,
  currentPath,
  bucketName,
  onStream,
  credentials,
}: UploadDirToS3Type): Promise<any> {
  const files = await fs.readdir(currentPath, { withFileTypes: true });
  const promises: Promise<any>[] = [];

  for (const file of files) {
    const fullPath = path.join(currentPath, file.name);

    if (file.isDirectory()) {
      const newPromise = uploadDirToS3({
        projectPath: projectPath,
        currentPath: fullPath,
        bucketName: bucketName,
        onStream: onStream,
        credentials: credentials,
      });

      promises.push(newPromise);
    } else {
      const uploadFile = async () => {
        const key = path.relative(projectPath, fullPath).replace(/\\/g, "/");
        const content = await fs.readFile(fullPath);
        const contentType = mime.lookup(fullPath) || "application/octet-stream";

        await putObject(credentials, bucketName, key, content, contentType);
        onStream({ source: "sys-info", data: `File ${key} uploaded!` });
      };

      promises.push(uploadFile());
    }
  }

  return Promise.all(promises);
}

export { uploadDirToS3 };
