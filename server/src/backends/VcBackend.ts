export interface VcBackendConstructor {
  create(path: string): Promise<VcBackend>;
}

export interface VcBackend {
  readonly path: string;
  listFast(): Promise<string[]>;
  list(): Promise<string[]>;
}
