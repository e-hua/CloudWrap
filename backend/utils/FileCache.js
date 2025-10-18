import fs from "fs/promises";
import path from "path";

class FileCache {
  constructor(dirName, ttlInMs) {
    // We resolve where the cache folder will be
    this.dirPath = path.resolve(`.cache/${dirName}`);
    // We keep track of what's the expected time to live for the file
    this.ttlInMs = ttlInMs;
  }

  async init() {
    // Ensuring the folder must exists
    await fs.mkdir(this.dirPath, { recursive: true });
  }

  #getKeyPath(key) {
    return path.join(this.dirPath, `${key}.json`);
  }

  async put(key, val) {
    // get the path to the cache file we're building
    const keyPath = this.#getKeyPath(key);
    const keyString = JSON.stringify(val);

    // atomic writes,
    // helps to prevent partial writing when application crashes
    await fs.writeFile(keyPath + ".tmp", keyString);
    await fs.rename(keyPath + ".tmp", keyPath);
  }

  async get(key) {
    try {
      const keyPath = this.#getKeyPath(key);
      const stat = await fs.stat(keyPath);
      // If the cache file is expired
      if (Date.now() - stat.mtimeMs > this.ttlInMs) {
        return null;
      }

      const file = await fs.readFile(keyPath, "utf-8");
      return JSON.parse(file);
    } catch (err) {
      return null;
    }
  }

  async clear() {
    const fileNamesInDir = await fs.readdir(this.dirPath);

    // An array of promises to remove all the expired caches
    const missions = fileNamesInDir.map(async (fileName) => {
      const fullPath = path.join(this.dirPath, fileName);
      const stat = await fs.stat(fullPath);
      // If the cache file is expired
      if (Date.now() - stat.mtimeMs > this.ttlInMs) {
        await fs.rm(fullPath);
      }
    });

    await Promise.all(missions);
  }
}

export { FileCache };
