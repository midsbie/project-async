// import crypto from "node:crypto";
import fs from "node:fs";

// `/tmp/tmp-${crypto.randomBytes(6).toString("hex")}`;
const filename = "/tmp/project-async-server.log";

export function log(logMessage: string) {
  const logEntry = `${new Date().toISOString()} - ${logMessage}\n`;
  fs.appendFile(filename, logEntry, (err) => {
    if (err) {
      console.error("Failed to write log entry:", err);
    }
  });
}
