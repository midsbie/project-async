import { Command } from "../Command";
import { GitLsFiles } from "../GitLsFiles";
import { MAX_CANDIDATES } from "../consts";

export class CompleteCommand extends Command<string[]> {
  directory: string;
  terms: string[];

  constructor(directory: string, terms: string[]) {
    super();
    this.directory = directory;
    this.terms = terms;
  }

  async run(): Promise<string[]> {
    const coll = await new GitLsFiles().list(this.directory);
    return this.terms
      .reduce((c, t) => c.filter((it) => it.includes(t)), coll)
      .slice(0, MAX_CANDIDATES);
  }
}
