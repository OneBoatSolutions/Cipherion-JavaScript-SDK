import winston from 'winston';
import path from 'path';
import fs from 'fs';

class CipherionLogger {
  private logger: winston.Logger;
  private logDir = 'cipherion-logs';

  constructor(logLevel: string = 'info') {
    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    this.logger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({
          filename: path.join(this.logDir, 'error.log'),
          level: 'error',
        }),
        new winston.transports.File({
          filename: path.join(this.logDir, 'combined.log'),
        }),
      ],
    });

    // Add console transport in development
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.simple(),
        })
      );
    }
  }

  info(message: string, meta?: any) {
    this.logger.info(message, meta);
  }

  error(message: string, error?: Error, meta?: any) {
    this.logger.error(message, { error, ...meta });
  }

  warn(message: string, meta?: any) {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: any) {
    this.logger.debug(message, meta);
  }

  logApiCall(method: string, endpoint: string, statusCode: number, duration: number) {
    this.info('API Call', {
      method,
      endpoint,
      statusCode,
      duration,
      timestamp: new Date().toISOString(),
    });
  }
}

export default CipherionLogger;