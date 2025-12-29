import getTofuBinaryPath from "@/utils/paths";
import { spawn } from "child_process";

type StreamData = {
  source: "stdout" | "stderr" | "sys-info" | "sys-failure";
  data: string;
};

type RunTofuCommand = {
  args: string[];
  dirPath: string;
  onStream: (data: StreamData) => void;
};

// This is built on the event emitter system which requires callback functions
// Which means we got to use Promise and reject for error handling
function runTofu({ args, dirPath, onStream }: RunTofuCommand): Promise<void> {
  const tofuPath = getTofuBinaryPath();

  return new Promise<void>((resolve, reject) => {
    const tofu_process = spawn(tofuPath, args, {
      cwd: dirPath,
      env: {
        ...process.env,
      },
    });

    tofu_process.stdout.on("data", (data) => {
      onStream({ source: "stdout", data: data.toString() });
    });

    tofu_process.stderr.on("data", (data) => {
      onStream({ source: "stderr", data: data.toString() });
    });

    tofu_process.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`OpenTofu exited with code ${code}`));
      }
    });

    tofu_process.on("error", (err) => {
      reject(err);
    });
  });
}

function runTofuAndCollect({args, dirPath}: Omit<RunTofuCommand, 'onStream'>): Promise<string> {
  const tofuPath = getTofuBinaryPath();

  return new Promise<string>((resolve, reject) => {
    const tofu_process = spawn(tofuPath, args, {
      cwd: dirPath,
      env: {
        ...process.env,
      },
    });

    let stdout = ''
    let stderr = ''

    tofu_process.stdout.on("data", (data) => {
      stdout+=data.toString();
    });

    tofu_process.stderr.on("data", (data) => {
      stderr+=data.toString()
    });

    tofu_process.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`OpenTofu exited with code ${code}: ${stderr}`));
      }
    });

    tofu_process.on("error", (err) => {
      reject(err);
    });
  });
}

export type { StreamData, RunTofuCommand };
export { runTofu, runTofuAndCollect};
