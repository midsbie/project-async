import { VcRepositoryCtl } from "../backends";
import { CompleteFileCommand, ServerCommand } from "../server";

export class CommandParser {
  repoCtl: VcRepositoryCtl;

  constructor(repoCtl: VcRepositoryCtl) {
    this.repoCtl = repoCtl;
  }

  async parse(input: string): Promise<ServerCommand<unknown> | null> {
    const parts = input
      .split(" ")
      .filter(Boolean)
      .map((i) => i.trim());
    if (parts.length < 1) return null;

    switch (parts[0]) {
      case "complete-file":
        if (parts.length < 2) return null;
        return new CompleteFileCommand(await this.repoCtl.get(parts[1]), parts.slice(2));
    }

    return null;
  }
}
