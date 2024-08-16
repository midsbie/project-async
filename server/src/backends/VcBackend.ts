export interface VcBackendConstructor {
  create(path: string): Promise<VcBackend>;
}

export interface VcBackend {
  readonly repoPath: string;
  list(): Promise<string[]>;
}
