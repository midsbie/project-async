import { Command } from "commander";

import { ResponseFormatter, ResponseFormatterFactory } from "../ResponseFormatter";
import { VcRepositoryCtl } from "../backends";
import { StdioServer } from "../server";
import { CommandParser } from "./CommandParser";

export class ServeCommand extends Command {
  static register(commander: Command): void {
    commander
      .command("serve")
      .option("--stdio", "Use stdio for communication")
      .option("--format <format>", "Specify output format (default: json)", "json")
      .description("Start server")
      .action(({ stdio, format }) => {
        if (!stdio) {
          throw new Error(
            "The --stdio option is required. Only the stdio implementation is available currently.",
          );
        }

        return new ServeCommand().run(
          new CommandParser(new VcRepositoryCtl()),
          ResponseFormatterFactory.fromName(format),
        );
      });
  }

  constructor() {
    super();
  }

  async run(commandParser: CommandParser, responseFormatter: ResponseFormatter): Promise<void> {
    await new StdioServer(commandParser, responseFormatter).run();
  }
}
