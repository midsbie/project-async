export interface ICommand<T> {
  run(): Promise<T>;
}

export abstract class Command<T> implements ICommand<T> {
  abstract run(): Promise<T>;
}
