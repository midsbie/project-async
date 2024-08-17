import { spawn, spawnSync } from "node:child_process";
import path from "node:path";

import { VcBackend } from "./VcBackend";
import { VcBackendFactory } from "./VcBackendFactory";

export class GitBackend implements VcBackend {
  readonly rootPath: string;

  static async create(repoPath: string): Promise<VcBackend> {
    repoPath = path.resolve(path.normalize(repoPath));

    const revParse = spawnSync("git", ["rev-parse", "--show-toplevel"], {
      encoding: "utf8",
      cwd: repoPath,
    });

    const rootPath = revParse.stdout.trim();
    if (revParse.error || revParse.stderr.trim() || !rootPath) {
      throw new Error(`Git repository not found at: ${repoPath}`);
    }

    return new GitBackend(rootPath);
  }

  private constructor(rootPath: string) {
    this.rootPath = rootPath;
  }

  listFast(subPath?: string): Promise<string[]> {
    return this._list(subPath, ["-z"]);
  }

  list(subPath?: string): Promise<string[]> {
    return this._list(subPath, ["-zco", "--exclude-standard"]);
  }

  private _list(subPath: string | undefined, args: string[]): Promise<string[]> {
    return new Promise((resolve) => {
      const gitProcess = spawn("git", ["ls-files", ...args], {
        cwd: subPath ? path.join(this.rootPath, subPath) : this.rootPath,
      });
      const output: Uint8Array[] = [];

      gitProcess.stdout.on("data", (data) => {
        output.push(data);
      });

      gitProcess.stderr.on("data", (data) => {
        console.error(`stderr: ${data}`);
      });

      gitProcess.on("error", (error) => {
        console.error(`error: ${error.message}`);
      });

      gitProcess.on("close", (code) => {
        if (code) console.error(`child process exited with code ${code}`);

        const result = Buffer.concat(output).toString("utf8").split("\0");
        if (result[result.length - 1] === "") result.pop();

        resolve(result);
      });
    });
  }
}

VcBackendFactory.register("git", GitBackend);
