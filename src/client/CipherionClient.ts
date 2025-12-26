// src/client/CipherionClient.ts
import dotenv from 'dotenv';
import { CipherionConfig, MigrationOptions, MigrationResult } from '../types/client';
import {
  EncryptResponse,
  DecryptResponse,
  DeepEncryptResponse,
  DeepDecryptResponse,
  DeepEncryptOptions,
  DeepDecryptOptions,
  DeepEncryptRequest,
  DeepDecryptRequest,
} from '../types/api';
import { HttpClient } from '../utils/http';
import { Validator } from '../utils/validation';
import CipherionLogger from '../utils/logger';
import { MigrationHelper } from '../utils/migration';
import { CipherionError } from '../errors/CipherionError';

dotenv.config();

export class CipherionClient {
  private config: CipherionConfig;
  private httpClient: HttpClient;
  private logger: CipherionLogger;
  private migrationHelper: MigrationHelper;

  constructor(config?: Partial<CipherionConfig>) {
    this.config = this.buildConfig(config);
    Validator.validateConfig(this.config);

    this.logger = new CipherionLogger(this.config.logLevel);
    this.httpClient = new HttpClient(
      this.config.baseUrl,
      this.config.apiKey,
      this.config.timeout,
      this.logger
    );
    this.migrationHelper = new MigrationHelper(this);

    if (this.config.enableLogging) {
      this.logger.info('CipherionClient initialized');
    }
  }

  private buildConfig(providedConfig?: Partial<CipherionConfig>): CipherionConfig {
    return {
      baseUrl: providedConfig?.baseUrl || process.env.CIPHERION_BASE_URL || '',
      projectId: providedConfig?.projectId || process.env.CIPHERION_PROJECT_ID || '',
      apiKey: providedConfig?.apiKey || process.env.CIPHERION_API_KEY || '',
      passphrase: providedConfig?.passphrase || process.env.CIPHERION_PASSPHRASE || '',
      timeout: providedConfig?.timeout || 30000,
      retries: providedConfig?.retries || 3,
      logLevel: providedConfig?.logLevel || 'info',
      enableLogging: providedConfig?.enableLogging !== false,
    };
  }

  /**
   * Helper to determine data type
   */
  private getDataType(data: any): string {
    if (data === null) return 'null';
    if (Array.isArray(data)) return 'array';
    return typeof data;
  }

  /**  Encrypts simple string
   * *@param data - The data string
   * @param options - Optional Encryption configuration
   * @returns Promise resolving to Encrypted data with metadata
   * * @example
   * ```typescript
   * 
   * const result = await client.encrypt(data);
   *
   * ```
   */
  async encrypt(data: string): Promise<string> {
    const startTime = Date.now();

    try {
      Validator.validateData(data);
      const finalPassphrase = this.config.passphrase;

      if (!finalPassphrase) {
        throw new CipherionError('Passphrase is required', 400);
      }

      Validator.validatePassphrase(finalPassphrase);

      const response = await this.httpClient.post<EncryptResponse>(
        `/api/v1/crypto/encrypt/${this.config.projectId}`,
        { data, passphrase: finalPassphrase }
      );

      if (this.config.enableLogging) {
        const durationMs = Date.now() - startTime;
        this.logger.logCryptoOperation('encrypt', 'success', {
          dataType: this.getDataType(data),
          dataLength: data.length,
          durationMs,
          statusCode: 200,
        });
      }

      return response.data.encrypted_output;
    } catch (error: any) {

      let status = 500;
      let serverMessage = 'Unknown error';

      if (error instanceof CipherionError) {
        status = error.statusCode;
        serverMessage = error.message;
      } else {
        // Fallback for raw Axios errors
        status = error.response?.status || 500;
        serverMessage = error.response?.data?.message || error.message;
      }

      const durationMs = Date.now() - startTime;

      if (this.config.enableLogging) {
        this.logger.logCryptoOperation('encrypt', 'error', {
          dataType: this.getDataType(data),
          dataLength: data?.length,
          durationMs,
          statusCode: status,
          errorMessage: serverMessage,
        });
      }

      throw new CipherionError(serverMessage, status);
    }
  }

  /**
   * Decrypts simple string
   * * @param data - The data string
   * @param options - Optional decryption configuration
   * @returns Promise resolving to decrypted data with metadata
   * * @example
   * ```typescript
   * 
   * const result = await client.decrypt(data);
   *
   * ```
   */
  async decrypt(encryptedData: string): Promise<string> {
    const startTime = Date.now();

    try {
      Validator.validateEncryptedData(encryptedData);
      const finalPassphrase = this.config.passphrase;
      
      if (!finalPassphrase) {
        throw new CipherionError('Passphrase is required', 400);
      }

      const response = await this.httpClient.post<DecryptResponse>(
        `/api/v1/crypto/decrypt/${this.config.projectId}`,
        { data: encryptedData, passphrase: finalPassphrase }
      );

      if (this.config.enableLogging) {
        const durationMs = Date.now() - startTime;
        this.logger.logCryptoOperation('decrypt', 'success', {
          dataType: 'string',
          dataLength: encryptedData.length,
          durationMs,
          statusCode: 200,
        });
      }

      return response.data.plaintext;
    } catch (error: any) {
      let status = 500;
      let serverMessage = 'Unknown error';

      if (error instanceof CipherionError) {
        status = error.statusCode;
        serverMessage = error.message;
      } else {
        status = error.response?.status || 500;
        serverMessage = error.response?.data?.message || error.message;
      }

      const durationMs = Date.now() - startTime;

      if (this.config.enableLogging) {
        this.logger.logCryptoOperation('decrypt', 'error', {
          dataType: this.getDataType(encryptedData),
          dataLength: encryptedData?.length,
          durationMs,
          statusCode: status,
          errorMessage: serverMessage,
        });
      }

      throw new CipherionError(serverMessage, status);
    }
  }

  /**
    * Encrypts complex data structures while preserving structure
    * * @param data - The data structure to encrypt
    * @param options - Optional encryption configuration
    * @returns Promise resolving to encrypted data with metadata
    * * @example
    * ```typescript
    * * // Simple usage (no exclusions)
    * const result = await client.deepEncrypt(data);
    * * // With field exclusions
    * const result = await client.deepEncrypt(data, {
    * exclude_fields: ['profile.id', 'users[0]'],
    * exclude_patterns: ['_id', '*_at']
    * });
    * ```
    */
  async deepEncrypt(data: any, options?: DeepEncryptOptions): Promise<DeepEncryptResponse['data']> {
    const startTime = Date.now();

    try {
      Validator.validateData(data);
      const finalPassphrase = this.config.passphrase;

      if (!finalPassphrase) {
        throw new CipherionError('Passphrase is required', 400);
      }

      Validator.validatePassphrase(finalPassphrase);

      const requestBody: DeepEncryptRequest = {
        data,
        passphrase: finalPassphrase,
        ...(options?.exclude_fields && { exclude_fields: options.exclude_fields }),
        ...(options?.exclude_patterns && { exclude_patterns: options.exclude_patterns }),
      };

      const response = await this.httpClient.post<DeepEncryptResponse>(
        `/api/v1/crypto/deep_encrypt/${this.config.projectId}`,
        requestBody
      );

      if (this.config.enableLogging) {
        const durationMs = Date.now() - startTime;
        this.logger.logCryptoOperation('deepEncrypt', 'success', {
          dataType: this.getDataType(data),
          totalFields: response.data.meta.totalFields,
          billableFields: response.data.meta.billableFields,
          excludedFields: options?.exclude_fields?.length || 0,
          excludedPatterns: options?.exclude_patterns?.length || 0,
          durationMs,
          statusCode: 200,
        });
      }

      return response.data.encrypted;
    } catch (error: any) {
      const status = error.status || error.response?.status || 500;
      const serverMessage = error.response?.data?.message || error.message;
      const durationMs = Date.now() - startTime;

      if (this.config.enableLogging) {
        this.logger.logCryptoOperation('deepEncrypt', 'error', {
          dataType: this.getDataType(data),
          excludedFields: options?.exclude_fields?.length || 0,
          excludedPatterns: options?.exclude_patterns?.length || 0,
          durationMs,
          statusCode: status,
          errorMessage: serverMessage,
        });
      }

      throw new CipherionError(serverMessage, status);
    }
  }

  /**
   * Decrypts complex data structures that were encrypted using deepEncrypt
   * * @param encryptedData - The encrypted data structure to decrypt
   * @param options - Optional decryption configuration
   * @returns Promise resolving to decrypted data with metadata
   * * @example
   * ```typescript
   **  // Simple usage (no exclusions)
   * const result = await client.deepDecrypt(encryptedData);
   * * // With field exclusions and graceful failure
   * const result = await client.deepDecrypt(encryptedData, {
   * exclude_fields: ['profile.id', 'users[0]'],
   * exclude_patterns: ['_id', '*_at'],
   * fail_gracefully: true
   * });
   * ```
   */
  async deepDecrypt(encryptedData: any, options?: DeepDecryptOptions): Promise<DeepDecryptResponse['data']> {
    const startTime = Date.now();
    
    try {
      Validator.validateEncryptedData(encryptedData);
      const finalPassphrase = this.config.passphrase;
      
      if (!finalPassphrase) {
        throw new CipherionError('Passphrase is required', 400);
      }

      const requestBody: DeepDecryptRequest = {
        encrypted: encryptedData,
        passphrase: finalPassphrase,
        ...(options?.exclude_fields && { exclude_fields: options.exclude_fields }),
        ...(options?.exclude_patterns && { exclude_patterns: options.exclude_patterns }),
        ...(options?.fail_gracefully !== undefined && { fail_gracefully: options.fail_gracefully }),
      };

      const response = await this.httpClient.post<DeepDecryptResponse>(
        `/api/v1/crypto/deep_decrypt/${this.config.projectId}`,
        requestBody
      );

      if (this.config.enableLogging) {
        const durationMs = Date.now() - startTime;
        this.logger.logCryptoOperation('deepDecrypt', 'success', {
          dataType: this.getDataType(encryptedData),
          totalFields: response.data.meta.totalFields,
          billableFields: response.data.meta.billableFields,
          excludedFields: options?.exclude_fields?.length || 0,
          excludedPatterns: options?.exclude_patterns?.length || 0,
          failGracefully: options?.fail_gracefully,
          durationMs,
          statusCode: 200,
        });
      }

      return response.data.data;
    } catch (error: any) {
      const status = error.status || error.response?.status || 500;
      const serverMessage = error.response?.data?.message || error.message;
      const durationMs = Date.now() - startTime;

      if (this.config.enableLogging) {
        this.logger.logCryptoOperation('deepDecrypt', 'error', {
          dataType: this.getDataType(encryptedData),
          excludedFields: options?.exclude_fields?.length || 0,
          excludedPatterns: options?.exclude_patterns?.length || 0,
          failGracefully: options?.fail_gracefully,
          durationMs,
          statusCode: status,
          errorMessage: " data may be corrupted or " + serverMessage,
        });
      }

      throw new CipherionError(serverMessage, status);
    }
  }

  /**
   * Migrates an array of data by encrypting each item in batches.
   * Useful for handling large datasets without blocking the event loop or hitting API rate limits.
   * * @param dataArray - Array of items to encrypt
   * @param options - Migration configuration (batch size, retries, etc.)
   */
  async migrateEncrypt(
    dataArray: any[],
    options?: MigrationOptions
  ): Promise<MigrationResult> {
    const finalPassphrase = this.config.passphrase;

    if (!finalPassphrase) {
      throw new CipherionError('Passphrase is required for migration', 400);
    }

    if (!Array.isArray(dataArray)) {
      throw new CipherionError('dataArray must be an array', 400);
    }

    if (dataArray.length === 0) {
      this.logger.warn('Empty array provided for encryption migration');
      return {
        successful: [],
        failed: [],
        summary: {
          total: 0,
          processed: 0,
          successful: 0,
          failed: 0,
          percentage: 100,
        },
      };
    }

    if (this.config.enableLogging) {
      this.logger.logMigrationOperation('migrateEncrypt', 'started', {
        totalItems: dataArray.length,
        batchSize: options?.batchSize || 10,
      });
    }

    try {
      const result = await this.migrationHelper.encryptMigration(
        dataArray,
        finalPassphrase,
        options
      );

      if (this.config.enableLogging) {
        this.logger.logMigrationOperation('migrateEncrypt', 'completed', {
          totalItems: result.summary.total,
          processed: result.summary.processed,
          successful: result.summary.successful,
          failed: result.summary.failed,
          percentage: result.summary.percentage,
        });
      }

      return result;
    } catch (error: any) {
      if (this.config.enableLogging) {
        this.logger.logMigrationOperation('migrateEncrypt', 'error', {
          totalItems: dataArray.length,
          errorMessage: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * Migrates an array of encrypted data by decrypting each item in batches.
   * * @param encryptedArray - Array of encrypted items to decrypt
   * @param options - Migration configuration
   */
  async migrateDecrypt(
    encryptedArray: any[],
    options?: MigrationOptions
  ): Promise<MigrationResult> {
    const finalPassphrase = this.config.passphrase;

    if (!finalPassphrase) {
      throw new CipherionError('Passphrase is required for migration', 400);
    }

    if (!Array.isArray(encryptedArray)) {
      throw new CipherionError('encryptedArray must be an array', 400);
    }

    if (encryptedArray.length === 0) {
      this.logger.warn('Empty array provided for decryption migration');
      return {
        successful: [],
        failed: [],
        summary: {
          total: 0,
          processed: 0,
          successful: 0,
          failed: 0,
          percentage: 100,
        },
      };
    }

    if (this.config.enableLogging) {
      this.logger.logMigrationOperation('migrateDecrypt', 'started', {
        totalItems: encryptedArray.length,
        batchSize: options?.batchSize || 10,
      });
    }

    try {
      const result = await this.migrationHelper.decryptMigration(
        encryptedArray,
        finalPassphrase,
        options
      );

      if (this.config.enableLogging) {
        this.logger.logMigrationOperation('migrateDecrypt', 'completed', {
          totalItems: result.summary.total,
          processed: result.summary.processed,
          successful: result.summary.successful,
          failed: result.summary.failed,
          percentage: result.summary.percentage,
        });
      }

      return result;
    } catch (error: any) {
      if (this.config.enableLogging) {
        this.logger.logMigrationOperation('migrateDecrypt', 'error', {
          totalItems: encryptedArray.length,
          errorMessage: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * Gets the current configuration (without sensitive data)
   */
  getConfig(): Omit<CipherionConfig, 'apiKey' | 'passphrase'> {
    const { apiKey, passphrase, ...safeConfig } = this.config;
    return safeConfig;
  }

  /**
   * Updates configuration (non-sensitive fields only)
   */
  updateConfig(newConfig: Partial<CipherionConfig>): void {
    const { apiKey, passphrase, ...safeConfig } = newConfig;

    if (apiKey || passphrase) {
      this.logger.warn('Attempted to update sensitive credentials - operation ignored');
      throw new CipherionError(
        'Cannot update apiKey or passphrase after initialization. Create a new client instance instead.',
        403
      );
    }

    this.config = { ...this.config, ...safeConfig };
    Validator.validateConfig(this.config);

    if (safeConfig.baseUrl || safeConfig.timeout !== undefined) {
      this.httpClient = new HttpClient(
        this.config.baseUrl,
        this.config.apiKey,
        this.config.timeout,
        this.logger
      );
    }

    if (this.config.enableLogging) {
      this.logger.info('Configuration updated', {
        updatedFields: Object.keys(safeConfig),
      });
    }
  }
}