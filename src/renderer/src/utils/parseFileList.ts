import type { S3_API_object } from "@shared/s3.types";
import { _Object } from "@aws-sdk/client-s3";

type Folder = S3_API_object & { FolderName: string };

type ParsedObject = {
  name: string;
  // file extension type
  type: string;
  lastModified: string;
  storageClass: string;
  size: string;
  isFolder: boolean;
};

type ParsedFile = { isFolder: false } & ParsedObject;

type ParsedFolder = {
  isFolder: true;
  folderContents: Folder[];
} & ParsedObject;

type ParseResult = {
  folders: ParsedFolder[];
  files: ParsedFile[];
};

function parseFileList(contents: _Object[]): ParseResult {
  const parsed: ParseResult = {
    folders: [
      // prefix(folder name): string -> things come before `/`
      // objects (by recurrence relations)
    ],
    files: [
      // type -> things go after `.`
      // All related attributes
    ],
  };

  // A mapping of folder names to folder objects
  const folderMap = new Map<string, ParsedFolder>();

  for (const content of contents) {
    const fileName = content.Key;

    if (!fileName) {
      continue;
    }

    // This is a file in a folder relative to current folder
    if (fileName.includes("/")) {
      const folderName = fileName.split("/")[0];
      const folderContent: Folder = {
        FolderName: folderName,
        Key: fileName.slice(folderName.length + 1), // excluding "folderName/"
        LastModified: content.LastModified?.toISOString(),
        Size: content.Size,
        StorageClass: content.StorageClass,
      };

      if (!folderMap.has(folderName)) {
        folderMap.set(folderName, {
          isFolder: true,
          folderContents: [],

          name: `${folderName}/`,
          type: "Folder",
          lastModified: "-",
          storageClass: "-",
          size: "-",
        });

        parsed.folders.push(folderMap.get(folderName) as ParsedFolder);
      }
      (folderMap.get(folderName) as ParsedFolder)["folderContents"].push(
        folderContent
      );
      // This is a file
    } else {
      const file: ParsedFile = {
        name: fileName,
        type: (fileName.includes(".") && fileName.split(".").at(-1)) || "-",
        lastModified: content.LastModified?.toISOString() || "-",
        storageClass: content.StorageClass || "-",
        size: parseSize(content.Size),
        isFolder: false,
      };

      parsed.files.push(file);
    }
  }

  return parsed;
}

function parseSize(sizeInBytes: number = 0): string {
  const base = 1024;

  // level = log_base(sizeInBytes)
  const level = Math.floor(Math.log(sizeInBytes) / Math.log(base));
  const scalar = sizeInBytes / Math.pow(base, level);

  const measurementUnits = ["B", "KB", "MB", "GB", "TB", "PB"];

  return `${scalar.toFixed(1)} ${measurementUnits[level]}`;
}

export { parseFileList };
export type { ParsedFile, ParsedFolder, ParseResult };
