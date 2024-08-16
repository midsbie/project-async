import { VcBackend } from "./VcBackend";
import { VcBackendFactory } from "./VcBackendFactory";

export class VcBackendCtl {
  knownBackends: VcKnownBackends;

  constructor() {
    this.knownBackends = new VcKnownBackends();
  }

  async getBackend(repoPath: string): Promise<VcBackend> {
    let backend = this.knownBackends.get(repoPath);
    if (backend) return backend;

    backend = await VcBackendFactory.getBackend(repoPath);
    if (backend) this.knownBackends.add(repoPath, backend);
    return backend;
  }
}

class VcKnownBackends {
  backends: Map<string, VcBackend>;

  constructor() {
    this.backends = new Map();
  }

  add(repoPath: string, backend: VcBackend) {
    this.backends.set(backend.repoPath, backend);
    if (repoPath !== backend.repoPath) this.backends.set(repoPath, backend);
  }

  del(repoPath: string) {
    this.backends.delete(repoPath);
  }

  get(repoPath: string): VcBackend | undefined {
    return this.backends.get(repoPath);
  }
}
