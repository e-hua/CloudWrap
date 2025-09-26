export function parseFileList(contents) {
  const parsed = {
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
  const folderMap = new Map();

  for (let content of contents) {
    const fileName = content.Key;

    // This is a file in a folder relative to current folder
    if (fileName.includes("/")) {
      const folderName = fileName.split("/")[0];
      const folderContent = {
        FolderName: folderName,
        Key: fileName.slice(folderName.length + 1), // excluding "folderName/"
        LastModified: content.LastModified,
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

        parsed.folders.push(folderMap.get(folderName));
      }
      folderMap.get(folderName)["folderContents"].push(folderContent);
      // This is a file
    } else {
      const file = {
        name: fileName,
        type: (fileName.includes(".") && fileName.split(".").at(-1)) || "-",
        lastModified: content.LastModified,
        storageClass: content.StorageClass,
        size: parseSize(content.Size),
      };

      parsed.files.push(file);
    }
  }

  return parsed;
}

function parseSize(sizeInBytes) {
  const base = 1024;

  // level = log_base(sizeInBytes)
  const level = Math.floor(Math.log(sizeInBytes) / Math.log(base));
  const scalar = sizeInBytes / Math.pow(base, level);

  const measurementUnits = ["B", "KB", "MB", "GB", "TB", "PB"];

  return `${scalar.toFixed(1)} ${measurementUnits[level]}`;
}
