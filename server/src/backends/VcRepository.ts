import path from "node:path";

import { MAX_CANDIDATES } from "../consts";
import { VcBackend } from "./VcBackend";

const UPDATE_THRESHOLD_MS = 60000;

export class VcRepository {
  private subPath: string | undefined;
  private backend: VcBackend;
  private assets: RepoAssets;
  private lastCompletionTime: number;

  constructor(backend: VcBackend, subPath?: string | undefined) {
    this.subPath = subPath;
    this.backend = backend;
    this.assets = new RepoAssets(backend);
    this.lastCompletionTime = 0;
  }

  get repoPath(): string {
    return this.subPath ? path.join(this.backend.rootPath, this.subPath) : this.backend.rootPath;
  }

  async completeFiles(terms: readonly string[]): Promise<string[]> {
    const now = Date.now();
    if (now - this.lastCompletionTime > UPDATE_THRESHOLD_MS) {
      await this.assets.update(this.subPath);
    }

    // RegExp-based approach is significantly faster than: it.toLowerCase().includes(t)
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
  }

  async update(subPath?: string | undefined): Promise<void> {
    this.set(await this.backend.listFast(subPath));

    this.backend.list(subPath).then((assets) => {
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
