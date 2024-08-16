import { VcBackendFactory } from "./VcBackendFactory";
import { VcRepository } from "./VcRepository";

export class VcRepositoryCtl {
  knownRepos: VcKnownRepositories;

  constructor() {
    this.knownRepos = new VcKnownRepositories();
  }

  async get(repoPath: string): Promise<VcRepository> {
    let repo = this.knownRepos.get(repoPath);
    if (repo) return repo;

    const backend = await VcBackendFactory.getBackend(repoPath);
    repo = new VcRepository(backend);
    this.knownRepos.add(repoPath, repo);
    return repo;
  }
}

class VcKnownRepositories {
  backends: Map<string, VcRepository>;

  constructor() {
    this.backends = new Map();
  }

  add(repoPath: string, repo: VcRepository) {
    this.backends.set(repo.repoPath, repo);
    if (repoPath !== repo.repoPath) this.backends.set(repoPath, repo);
  }

  del(repoPath: string) {
    this.backends.delete(repoPath);
  }

  get(repoPath: string): VcRepository | undefined {
    return this.backends.get(repoPath);
  }
}
