import path from "path";
import pkg from 'fs-extra';
const { ensureDir, pathExists, readJson } = pkg;
import decompress from "decompress"
import { chmod } from "fs/promises";

async function downloadTofu() {
  const configPath = path.join(import.meta.dirname, '..', 'opentofu.config.json');
  const { version, baseUrl } = await readJson(configPath);

  const platform = process.platform === 'win32' ? 'windows' : process.platform;

  const archMap: Record<string, string> = { x64: 'amd64', arm64: 'arm64' };
  const arch = archMap[process.arch] || process.arch;   

  const filename = `tofu_${version}_${platform}_${arch}.zip`;
  const url = `${baseUrl}/v${version}/${filename}`;
  console.log(url)
  
  const binName = process.platform === 'win32' ? 'tofu.exe' : 'tofu';
  const targetDir = path.join(
    import.meta.dirname,
    '..', 'src', 'main', 'resources', 'bin', `tofu_${version}_${platform}_${arch}`
  );  

  const targetFilePath = path.join(targetDir, binName);

  if (await pathExists(targetFilePath)) {
    console.log(`Skipping download.`);
    return;
  }

  try {
    console.log(`Downloading OpenTofu`);
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer(); 
    const buffer = Buffer.from(arrayBuffer);

    await ensureDir(targetDir);
    await decompress(buffer, targetDir);

    if (process.platform !== 'win32') {
      await chmod(targetFilePath, 0o755);
    }

    console.log(`Successfully downloaded OpenTofu at ${targetFilePath}`);
  } catch (err) {
    console.error(err);
  }
}

downloadTofu().catch((err) => {
  console.error("System error: ", err);
  process.exit(1);
});

export default downloadTofu;