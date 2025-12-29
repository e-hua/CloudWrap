import { app } from "electron";
import path from "path";

declare const __TOFU_VERSION__: string;

export function getTofuBinaryPath(): string {
const isDev = !app.isPackaged;
  
  const binDir = isDev
    ? path.join(app.getAppPath(), "src", "main", "resources", "bin")
    : path.join(process.resourcesPath, "bin");

  const platform = process.platform === 'win32' ? 'windows' : process.platform;
  const archMap: Record<string, string> = { x64: 'amd64', arm64: 'arm64' };
  const arch = archMap[process.arch] || process.arch;
  
  const version = __TOFU_VERSION__;

  const folderName = `tofu_${version}_${platform}_${arch}`;
  const binName = process.platform === "win32" ? "tofu.exe" : "tofu";

  return path.join(binDir, folderName, binName);
}

export default getTofuBinaryPath