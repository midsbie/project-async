import { VcRepository } from "../backends";
import { ServerCommand } from "./command";

export class CompleteFileCommand extends ServerCommand<string[]> {
  readonly repo: VcRepository;
  readonly terms: string[];

  constructor(repo: VcRepository, terms: string[]) {
    super();
    this.repo = repo;
    this.terms = terms;
  }

  async run(): Promise<string[]> {
    return this.repo.completeFiles(this.terms);
  }
}
