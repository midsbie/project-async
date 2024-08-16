import { VcBackend, VcBackendConstructor } from "./VcBackend";

export class VcBackendFactory {
  static registry: Map<string, VcBackendConstructor> = new Map();

  static register(name: string, backend: VcBackendConstructor): void {
    this.registry.set(name, backend);
  }

  static async getBackend(repoPath: string): Promise<VcBackend> {
    for (const [, Class] of this.registry.entries()) {
      try {
        return await Class.create(repoPath);
      } catch (_e: any) {
        // nop
      }
    }

    throw new Error(`No backend found for: ${repoPath}`);
  }
}
