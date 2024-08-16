import path from "node:path";

import { Command } from "commander";

import { ServeCommand } from "./ServeCommand";

export class Application {
  readonly rootCommand: Command;

  constructor() {
    this.rootCommand = new Command();
    this.rootCommand
      .name(path.basename(process.argv[1]))
      .description("Project Async server")
      .version("1.0.0");

    ServeCommand.register(this.rootCommand);
  }

  async run() {
    await this.rootCommand.parseAsync(process.argv);
  }
}
