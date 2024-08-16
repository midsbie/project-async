import { CompleteFileCommand, ServerCommand } from "../server";

export class CommandParser {
  parse(input: string): ServerCommand<unknown> | null {
    const parts = input
      .split(" ")
      .filter(Boolean)
      .map((i) => i.trim());
    if (parts.length < 1) return null;

    switch (parts[0]) {
      case "complete-file":
        if (parts.length < 2) return null;
        return new CompleteFileCommand(parts[1], parts.slice(2));
    }

    return null;
  }
}
