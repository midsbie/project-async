export interface VcBackendConstructor {
  create(repoPath: string): Promise<VcBackend>;
}

export interface VcBackend {
  readonly rootPath: string;
  listFast(subPath?: string): Promise<string[]>;
  list(subPath?: string): Promise<string[]>;
}
