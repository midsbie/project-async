export interface ICommand<T> {
  run(): Promise<T>;
}

export abstract class ServerCommand<T> implements ICommand<T> {
  abstract run(): Promise<T>;
}
