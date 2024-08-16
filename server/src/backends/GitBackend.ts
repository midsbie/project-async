import { spawn, spawnSync } from "child_process";

import { VcBackend } from "./VcBackend";
import { VcBackendFactory } from "./VcBackendFactory";

export class GitBackend implements VcBackend {
  readonly repoPath: string;

  static async create(repoPath: string): Promise<VcBackend> {
    const revParse = spawnSync("git", ["rev-parse", "--show-toplevel"], {
      encoding: "utf8",
      cwd: repoPath,
    });

    const stdout = revParse.stdout.trim();
    if (revParse.error || revParse.stderr.trim() || !stdout) {
      throw new Error(`Git repository not found at: ${repoPath}`);
    }

    return new GitBackend(stdout);
  }

  private constructor(path: string) {
    this.repoPath = path;
  }

  list(): Promise<string[]> {
    return new Promise((resolve) => {
      const gitProcess = spawn("git", ["ls-files", "-zco", "--exclude-standard"], {
        cwd: this.repoPath,
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
