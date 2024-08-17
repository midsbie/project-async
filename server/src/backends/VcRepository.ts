import { MAX_CANDIDATES } from "../consts";
import { VcBackend } from "./VcBackend";

const UPDATE_THRESHOLD_MS = 60000;

export class VcRepository {
  private backend: VcBackend;
  private assets: RepoAssets;
  private lastCompletionTime: number;

  constructor(backend: VcBackend) {
    this.backend = backend;
    this.assets = new RepoAssets(backend);
    this.lastCompletionTime = 0;
  }

  get path(): string {
    return this.backend.path;
  }

  async completeFiles(terms: readonly string[]): Promise<string[]> {
    const now = Date.now();
    if (now - this.lastCompletionTime > UPDATE_THRESHOLD_MS) await this.assets.update();

    // RegExp-based approach is significantly faster than it.toLowerCase().includes(t)
    const res = terms.map((t) => new RegExp(t, "i"));
    const r = res
      .reduce((c, re) => c.filter((it) => re.test(it)), this.assets.getAsArray())
      .slice(0, MAX_CANDIDATES);
    this.lastCompletionTime = now;
    return r;
  }
}

class RepoAssets {
  backend: VcBackend;
  assets: Set<string>;
  lastUpdate: number;

  constructor(backend: VcBackend) {
    this.backend = backend;
    this.assets = new Set();

    this.lastUpdate = 0;
    this.update();
  }

  async update(): Promise<void> {
    this.set(await this.backend.listFast());

    this.backend.list().then((assets) => {
      this.set(assets);
      this.lastUpdate = Date.now();
    });
  }

  private set(assets: string[]): void {
    this.assets = new Set(assets);
  }

  get(): Set<string> {
    return this.assets;
  }

  getAsArray(): string[] {
    return [...this.assets];
  }
}
