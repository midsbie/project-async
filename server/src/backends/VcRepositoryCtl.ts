import { VcBackendFactory } from "./VcBackendFactory";
import { VcRepository } from "./VcRepository";

export class VcRepositoryCtl {
  knownRepos: VcKnownRepositories;

  constructor() {
    this.knownRepos = new VcKnownRepositories();
  }

  async get(path: string): Promise<VcRepository> {
    let repo = this.knownRepos.get(path);
    if (repo) return repo;

    const backend = await VcBackendFactory.getBackend(path);
    repo = new VcRepository(backend);
    this.knownRepos.add(path, repo);
    return repo;
  }
}

class VcKnownRepositories {
  backends: Map<string, VcRepository>;

  constructor() {
    this.backends = new Map();
  }

  add(path: string, repo: VcRepository) {
    this.backends.set(repo.path, repo);
    if (path !== repo.path) this.backends.set(path, repo);
  }

  del(path: string) {
    this.backends.delete(path);
  }

  get(path: string): VcRepository | undefined {
    return this.backends.get(path);
  }
}
