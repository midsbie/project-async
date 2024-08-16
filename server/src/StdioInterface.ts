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
      const result = await this.process(input);
      console.log(JSON.stringify(result));
    });

    rl.on("close", () => {
      console.log("Input stream closed");
    });
  }

  private async process(input: string) {
    await this.job;

    const command = this.commandParser.parse(input);
    if (command == null) return [];

    this.job = new Promise(async (resolve) => {
      try {
        resolve(await command.run());
      } catch (e) {
        console.error("Error while running command:", e);
        resolve([]);
      }
    });

    return await this.job;
  }
}
