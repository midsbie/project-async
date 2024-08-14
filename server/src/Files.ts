import { spawn } from 'child_process'

export class GitLsFiles {
  list(directory: string): Promise<string[]> {
    return new Promise((resolve) => {
      const gitProcess = spawn('git', ['ls-files', '-zco', '--exclude-standard'],
        { cwd: directory }
      );

      const output: Uint8Array[] = [];

      gitProcess.stdout.on('data', (data) => {
        output.push(data);
      });

      gitProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });

      gitProcess.on('error', (error) => {
        console.error(`error: ${error.message}`);
      });

      gitProcess.on('close', (code) => {
        if (code) console.error(`child process exited with code ${code}`);

        const result = Buffer.concat(output).toString('utf8').split('\0');
        if (result[result.length - 1] === '') result.pop();

        resolve(result);
      });
    });
  }
}