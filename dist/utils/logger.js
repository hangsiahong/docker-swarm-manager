"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class Logger {
    constructor() {
        this.logFilePath = path_1.default.join(__dirname, "application.log");
    }
    log(message) {
        const logMessage = this.formatMessage(message);
        console.log(logMessage);
        this.writeToFile(logMessage);
    }
    error(message) {
        const logMessage = this.formatMessage(`ERROR: ${message}`);
        console.error(logMessage);
        this.writeToFile(logMessage);
    }
    formatMessage(message) {
        const timestamp = new Date().toISOString();
        return `${timestamp} - ${message}`;
    }
    writeToFile(message) {
        fs_1.default.appendFile(this.logFilePath, message + "\n", (err) => {
            if (err) {
                console.error("Failed to write to log file", err);
            }
        });
    }
    info(message) {
        const logMessage = this.formatMessage(`INFO: ${message}`);
        console.info(logMessage);
        this.writeToFile(logMessage);
    }
}
exports.default = new Logger();
