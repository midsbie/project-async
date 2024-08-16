import { Command } from "./Command";
import { LsFilesCommand } from "./commands/ls-files";

export class CommandParser {
  parse(input: string): Command<unknown> | null {
    const parts = input
      .split(" ")
      .filter(Boolean)
      .map((i) => i.trim());
    if (parts.length < 1) return null;

    switch (parts[0]) {
      case "ls-files":
        if (parts.length < 2) return null;
        return new LsFilesCommand(parts[1], parts.slice(2));
    }

    return null;
  }
}
