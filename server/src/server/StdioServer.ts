import readline from "readline";

import { ResponseFormatter } from "../ResponseFormatter";
import { ServerCommand } from "./command";

interface CommandParser {
  parse(input: string): ServerCommand<unknown> | null;
}

export class StdioServer {
  job: Promise<any> | null;
  commandParser: CommandParser;
  responseFormatter: ResponseFormatter;

  constructor(commandParser: CommandParser, responseFormatter: ResponseFormatter) {
    this.job = null;
    this.commandParser = commandParser;
    this.responseFormatter = responseFormatter;
  }

  run() {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
      });

      rl.on("line", async (input) => {
        try {
          const result = await this.process(input);
          console.log(this.responseFormatter.format(result));
        } catch (e) {
          console.error(e);
        }
      });

      rl.on("close", resolve);
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
