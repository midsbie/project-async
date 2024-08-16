import { MAX_CANDIDATES } from "../consts";
import { VcBackend } from "./VcBackend";

export class VcRepository {
  private backend: VcBackend;
  private assets: readonly string[];

  constructor(backend: VcBackend) {
    this.backend = backend;
    this.assets = [];
  }

  get repoPath(): string {
    return this.backend.repoPath;
  }

  async completeFiles(terms: readonly string[]): Promise<string[]> {
    const coll = this.assets;
    return terms.reduce((c, t) => c.filter((it) => it.includes(t)), coll).slice(0, MAX_CANDIDATES);
  }
}
