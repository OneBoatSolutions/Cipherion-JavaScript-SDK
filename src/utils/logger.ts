// src/utils/logger.ts
import winston from 'winston';
import path from 'path';
import fs from 'fs';

class CipherionLogger {
  private logger: winston.Logger;
  private logDir = 'cipherion-logs';
  private readonly SENSITIVE_PATTERNS = [
    /passphrase/i,
    /password/i,
    /api[_-]?key/i,
    /secret/i,
    /token/i,
    /authorization/i,
    /credential/i,
  ];

  constructor(logLevel: string = 'info') {
    this.ensureLogDirectory();
    this.logger = this.createLogger(logLevel);
  }

  private ensureLogDirectory(): void {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true, mode: 0o750 });
      }
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  private createLogger(logLevel: string): winston.Logger {
    const logger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: false }), 
        winston.format.printf(({ level, message, timestamp }) => {
          return `${timestamp} [${level}]: ${message}`;
        })
      ),
      transports: [
        // Error logs - separate file for critical issues
        new winston.transports.File({
          filename: path.join(this.logDir, 'error.log'),
          level: 'error',
          maxsize: 10485760, // 10MB
          maxFiles: 5,
          tailable: true,
        }),
        // Combined logs - all log levels
        new winston.transports.File({
          filename: path.join(this.logDir, 'combined.log'),
          maxsize: 10485760, // 10MB
          maxFiles: 5,
          tailable: true,
        }),
      ],
     
      exitOnError: false,
    });

    // Console logging for development only
    if (process.env.NODE_ENV !== 'production') {
      logger.add(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp }) => {
              return `${timestamp} [${level}]: ${message}`;
            })
          ),
        })
      );
    }

    return logger;
  }

  /**
   * Recursively sanitizes metadata to remove sensitive information
   */
  private sanitizeMetadata(obj: any, depth = 0): any {
    const MAX_DEPTH = 5;
    
    if (depth > MAX_DEPTH || obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeMetadata(item, depth + 1));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      
      for (const [key, value] of Object.entries(obj)) {
        if (this.isSensitiveKey(key)) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object') {
          sanitized[key] = this.sanitizeMetadata(value, depth + 1);
        } else if (typeof value === 'string' && value.length > 100) {
          sanitized[key] = value.substring(0, 100) + '...[TRUNCATED]';
        } else {
          sanitized[key] = value;
        }
      }
      
      return sanitized;
    }

    return obj;
  }

  /**
   * Checks if a key name indicates sensitive data
   */
  private isSensitiveKey(key: string): boolean {
    return this.SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
  }

  /**
   * Sanitizes error objects for safe logging
   */
  private sanitizeError(error: any): any {
    if (!error) return null;

    const rootError = error.originalError || error;
    const sanitized: any = {
      message: error.message || 'Unknown error',
    };

    // HTTP Response Errors (4xx, 5xx)
    if (rootError.response) {
      sanitized.status = rootError.response.status;
      sanitized.statusText = rootError.response.statusText;
      sanitized.method = rootError.config?.method?.toUpperCase();
      
      // Sanitize API error response
      if (rootError.response.data) {
        sanitized.apiError = {
          message: rootError.response.data.message,
          code: rootError.response.data.code,
        };
      }
    }
    // Network Errors
    else if (rootError.isAxiosError && rootError.code) {
      sanitized.code = rootError.code;
      sanitized.type = 'NetworkError';
      sanitized.method = rootError.config?.method?.toUpperCase();
    }
    // Standard Errors
    else {
      sanitized.name = error.name;
      if (error.stack && process.env.NODE_ENV !== 'production') {
        sanitized.stackFirstLine = error.stack.split('\n')[0];
      }
    }

    return sanitized;
  }

  /**
   * Logs informational messages
   */
  info(message: string, meta?: any): void {
    if (meta && Object.keys(meta).length > 0) {
      const sanitized = this.sanitizeMetadata(meta);
      const metaStr = Object.entries(sanitized)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(', ');
      this.logger.info(`${message} | ${metaStr}`);
    } else {
      this.logger.info(message);
    }
  }

  /**
   * Logs error messages with safe error handling
   */
  error(message: string, error?: any, meta?: any): void {
    const sanitizedError = this.sanitizeError(error);
    const parts = [message];
    
    if (sanitizedError) {
      parts.push(`error=${JSON.stringify(sanitizedError)}`);
    }
    
    if (meta && Object.keys(meta).length > 0) {
      const sanitized = this.sanitizeMetadata(meta);
      const metaStr = Object.entries(sanitized)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(', ');
      parts.push(metaStr);
    }
    
    this.logger.error(parts.join(' | '));
  }

  /**
   * Logs warning messages
   */
  warn(message: string, meta?: any): void {
    if (meta && Object.keys(meta).length > 0) {
      const sanitized = this.sanitizeMetadata(meta);
      const metaStr = Object.entries(sanitized)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(', ');
      this.logger.warn(`${message} | ${metaStr}`);
    } else {
      this.logger.warn(message);
    }
  }

  /**
   * Logs debug messages (development only)
   */
  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV !== 'production') {
      if (meta && Object.keys(meta).length > 0) {
        const sanitized = this.sanitizeMetadata(meta);
        const metaStr = Object.entries(sanitized)
          .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
          .join(', ');
        this.logger.debug(`${message} | ${metaStr}`);
      } else {
        this.logger.debug(message);
      }
    }
  }

  /**
   * Logs cryptographic operations with detailed metadata in a single line
   */
  logCryptoOperation(
    operation: 'encrypt' | 'decrypt' | 'deepEncrypt' | 'deepDecrypt',
    status: 'success' | 'error',
    metadata: {
      dataType?: string;
      dataLength?: number;
      totalFields?: number;
      billableFields?: number;
      excludedFields?: number;
      excludedPatterns?: number;
      failedFields?: number;
      failGracefully?: boolean;
      durationMs?: number;
      statusCode?: number;
      errorMessage?: string;
    }
  ): void {
    const level = status === 'error' ? 'error' : 'info';
    
    const parts: string[] = [`operation=${operation}`, `status=${status}`];

    // Add metadata conditionally
    if (metadata.dataType) parts.push(`dataType=${metadata.dataType}`);
    if (metadata.dataLength !== undefined) parts.push(`dataLength=${metadata.dataLength}`);
    if (metadata.totalFields !== undefined) parts.push(`totalFields=${metadata.totalFields}`);
    if (metadata.billableFields !== undefined) parts.push(`billableFields=${metadata.billableFields}`);
    if (metadata.excludedFields !== undefined) parts.push(`excludedFields=${metadata.excludedFields}`);
    if (metadata.excludedPatterns !== undefined) parts.push(`excludedPatterns=${metadata.excludedPatterns}`);
    if (metadata.failedFields !== undefined) parts.push(`failedFields=${metadata.failedFields}`);
    if (metadata.failGracefully !== undefined) parts.push(`failGracefully=${metadata.failGracefully}`);
    if (metadata.durationMs !== undefined) parts.push(`durationMs=${metadata.durationMs}`);
    if (metadata.statusCode !== undefined) parts.push(`statusCode=${metadata.statusCode}`);
    if (metadata.errorMessage) parts.push(`error="${metadata.errorMessage}"`);

    const logMessage = parts.join(' | ');
    this.logger.log(level, logMessage);
  }

  /**
   * Logs migration operations in a single line
   */
  logMigrationOperation(
    operation: 'migrateEncrypt' | 'migrateDecrypt',
    stage: 'started' | 'completed' | 'error',
    metadata: {
      totalItems?: number;
      processed?: number;
      successful?: number;
      failed?: number;
      percentage?: number;
      batchSize?: number;
      currentBatch?: number;
      errorMessage?: string;
    }
  ): void {
    const level = stage === 'error' ? 'error' : 'info';
    
    const parts: string[] = [`operation=${operation}`, `stage=${stage}`];

    // Add metadata conditionally
    if (metadata.totalItems !== undefined) parts.push(`totalItems=${metadata.totalItems}`);
    if (metadata.processed !== undefined) parts.push(`processed=${metadata.processed}`);
    if (metadata.successful !== undefined) parts.push(`successful=${metadata.successful}`);
    if (metadata.failed !== undefined) parts.push(`failed=${metadata.failed}`);
    if (metadata.percentage !== undefined) parts.push(`percentage=${metadata.percentage.toFixed(2)}%`);
    if (metadata.batchSize !== undefined) parts.push(`batchSize=${metadata.batchSize}`);
    if (metadata.currentBatch !== undefined) parts.push(`currentBatch=${metadata.currentBatch}`);
    if (metadata.errorMessage) parts.push(`error="${metadata.errorMessage}"`);

    const logMessage = parts.join(' | ');
    this.logger.log(level, logMessage);
  }
}

export default CipherionLogger;