import path from "node:path";

import { VcBackendFactory } from "./VcBackendFactory";
import { VcRepository } from "./VcRepository";

export class VcRepositoryCtl {
  knownRepos: VcKnownRepositories;

  constructor() {
    this.knownRepos = new VcKnownRepositories();
  }

  async get(repoPath: string): Promise<VcRepository> {
    repoPath = path.resolve(path.normalize(repoPath));

    let repo = this.knownRepos.get(repoPath);
    if (repo) return repo;

    const backend = await VcBackendFactory.getBackend(repoPath);
    let subPath;
    if (repoPath !== backend.rootPath && repoPath.startsWith(backend.rootPath)) {
      subPath = repoPath.substring(backend.rootPath.length).replace(/^[/]+/, "");
    }

    repo = new VcRepository(backend, subPath);
    this.knownRepos.add(repo);
    return repo;
  }
}

class VcKnownRepositories {
  repos: Map<string, VcRepository>;

  constructor() {
    this.repos = new Map();
  }

  add(repo: VcRepository) {
    this.repos.set(repo.repoPath, repo);
  }

  del(repoPath: string) {
    this.repos.delete(repoPath);
  }

  get(path: string): VcRepository | undefined {
    return this.repos.get(path);
  }
}
