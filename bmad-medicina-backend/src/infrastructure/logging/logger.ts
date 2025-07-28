import { config } from "../config/config.ts";

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

class Logger {
  private level: LogLevel;

  constructor() {
    this.level = this.getLogLevel(config.logLevel);
  }

  private getLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case "error":
        return LogLevel.ERROR;
      case "warn":
        return LogLevel.WARN;
      case "info":
        return LogLevel.INFO;
      case "debug":
        return LogLevel.DEBUG;
      default:
        return LogLevel.INFO;
    }
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (level <= this.level) {
      const timestamp = new Date().toISOString();
      const levelName = LogLevel[level];
      const logEntry = {
        timestamp,
        level: levelName,
        message,
        ...(data ? { data } : {}),
      };

      if (level === LogLevel.ERROR) {
        console.error(JSON.stringify(logEntry));
      } else {
        console.log(JSON.stringify(logEntry));
      }
    }
  }

  error(message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
  }

  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  // Medical data logging with privacy compliance
  logMedicalEvent(
    event: string,
    patientId: string,
    metadata?: Record<string, unknown>,
  ): void {
    // Hash patient ID for privacy compliance (Ley 19.628)
    const hashedPatientId = this.hashPatientId(patientId);

    this.info(`Medical Event: ${event}`, {
      hashedPatientId,
      timestamp: new Date().toISOString(),
      ...metadata,
    });
  }

  private async hashPatientId(patientId: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(patientId + config.encryptionKey);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
}

export const logger = new Logger();
