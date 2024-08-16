import { Command } from "./Command";
import { CompleteCommand } from "./commands/CompleteCommand";

export class CommandParser {
  parse(input: string): Command<unknown> | null {
    const parts = input
      .split(" ")
      .filter(Boolean)
      .map((i) => i.trim());
    if (parts.length < 1) return null;

    switch (parts[0]) {
      case "complete":
        if (parts.length < 2) return null;
        return new CompleteCommand(parts[1], parts.slice(2));
    }

    return null;
  }
}
