import { VcBackend } from "../backends/VcBackend";
import { MAX_CANDIDATES } from "../consts";
import { ServerCommand } from "./command";

export class CompleteFileCommand extends ServerCommand<string[]> {
  readonly backend: VcBackend;
  readonly terms: string[];

  constructor(backend: VcBackend, terms: string[]) {
    super();
    this.backend = backend;
    this.terms = terms;
  }

  async run(): Promise<string[]> {
    const coll = await this.backend.list();
    return this.terms
      .reduce((c, t) => c.filter((it) => it.includes(t)), coll)
      .slice(0, MAX_CANDIDATES);
  }
}
