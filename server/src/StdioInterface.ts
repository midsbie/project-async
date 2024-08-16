import readline from "readline";

import { CommandParser } from "./CommandParser";

export class StdioCommandInterface {
  job: Promise<any> | null;
  commandParser: CommandParser;

  constructor(commandParser: CommandParser) {
    this.job = null;
    this.commandParser = commandParser;
  }

  run() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    rl.on("line", async (input) => {
      let result;

      try {
        result = await this.process(input);
      } catch (e) {
        console.error(e);
        result = [];
      }

      console.log(JSON.stringify(result));
    });

    rl.on("close", () => {
      process.exit(0);
    });
  }

  private async process(input: string) {
    if (this.job) await this.job;

    const command = this.commandParser.parse(input);
    if (!command) return [];

    try {
      this.job = command.run();
      return await this.job;
    } finally {
      this.job = null;
    }
  }
}
