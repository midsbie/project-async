import { Application } from "./application/Application";

export async function main() {
  const application = new Application();
  await application.run();
}
