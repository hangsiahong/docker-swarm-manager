import { info } from "console";
import fs from "fs";
import path from "path";

class Logger {
  private logFilePath: string;

  constructor() {
    this.logFilePath = path.join(__dirname, "application.log");
  }

  log(message: string): void {
    const logMessage = this.formatMessage(message);
    console.log(logMessage);
    this.writeToFile(logMessage);
  }

  error(message: string): void {
    const logMessage = this.formatMessage(`ERROR: ${message}`);
    console.error(logMessage);
    this.writeToFile(logMessage);
  }

  private formatMessage(message: string): string {
    const timestamp = new Date().toISOString();
    return `${timestamp} - ${message}`;
  }

  private writeToFile(message: string): void {
    fs.appendFile(this.logFilePath, message + "\n", (err) => {
      if (err) {
        console.error("Failed to write to log file", err);
      }
    });
  }

  info(message: string): void {
    const logMessage = this.formatMessage(`INFO: ${message}`);
    console.info(logMessage);
    this.writeToFile(logMessage);
  }
}

export default new Logger();
