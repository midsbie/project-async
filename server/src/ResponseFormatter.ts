export interface ResponseFormatter {
  format(result: unknown): string;
}

class JsonResponseFormatter implements ResponseFormatter {
  format(result: unknown): string {
    return JSON.stringify(result);
  }
}

type ResponseFormatterName = "json";
type ResponseFormatterConstructor = new () => ResponseFormatter;

const formattersByName: Map<ResponseFormatterName, ResponseFormatterConstructor> = new Map([
  ["json", JsonResponseFormatter],
]);

export class ResponseFormatterFactory {
  static fromName(name: string) {
    const Class = formattersByName.get(name.toLowerCase() as any);
    if (!Class) throw new Error(`Invalid formatter (${name})`);
    return new Class();
  }
}
