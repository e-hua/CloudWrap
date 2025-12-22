import type {RunTofuCommand} from "@/services/deploymentService/runTofu.js";
import type {CopyOptions, ObjectEncodingOptions, PathLike, RmOptions} from "fs-extra";

type ServiceOperationDeps = {
  runTofu: (command: RunTofuCommand) => Promise<void>

  mkdtemp: (prefix: string, options?: ObjectEncodingOptions | BufferEncoding | null) => Promise<string>
  copy: (src: string, dest: string, options?: CopyOptions) => Promise<void>
  rm: (path: PathLike, options?: RmOptions) => Promise<void>
  tmpdir: () => string
}

export type {ServiceOperationDeps}