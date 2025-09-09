import dotenv from 'dotenv';
import { CipherionConfig, MigrationOptions, MigrationResult } from '../types/client';
import {
  EncryptResponse,
  DecryptResponse,
  DeepEncryptResponse,
  DeepDecryptResponse,
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
      this.logger.info('CipherionClient initialized', {
        projectId: this.config.projectId,
        baseUrl: this.config.baseUrl,
      });
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
   * Encrypts a string using basic encryption
   */
  async encrypt(data: string): Promise<string> {
    try {
      Validator.validateData(data);
      const finalPassphrase =  this.config.passphrase;
      
      if (!finalPassphrase) {
        throw new CipherionError('Passphrase is required', 400);
      }
      
      Validator.validatePassphrase(finalPassphrase);

      const response = await this.httpClient.post<EncryptResponse>(
        `/api/v1/crypto/encrypt/${this.config.projectId}`,
        { data, passphrase: finalPassphrase }
      );

      if (this.config.enableLogging) {
        this.logger.info('Basic encryption completed successfully', {
          dataLength: data.length,
        });
      }

      return response.data.encrypted_output;
    } catch (error) {
      this.logger.error('Basic encryption failed', error as Error);
      throw error;
    }
  }

  /**
   * Decrypts a string using basic decryption
   */
  async decrypt(encryptedData: string): Promise<string> {
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
        this.logger.info('Basic decryption completed successfully');
      }

      return response.data.plaintext;
    } catch (error) {
      this.logger.error('Basic decryption failed', error as Error);
      throw error;
    }
  }

  /**
   * Encrypts complex data structures while preserving structure
   */
  async deepEncrypt(data: any): Promise<DeepEncryptResponse['data']> {
    try {
      Validator.validateData(data);
      const finalPassphrase =  this.config.passphrase;
      
      if (!finalPassphrase) {
        throw new CipherionError('Passphrase is required', 400);
      }
      
      Validator.validatePassphrase(finalPassphrase);

      const response = await this.httpClient.post<DeepEncryptResponse>(
        `/api/v1/crypto/deep_encrypt/${this.config.projectId}`,
        { data, passphrase: finalPassphrase }
      );

      if (this.config.enableLogging) {
        this.logger.info('Deep encryption completed successfully', {
          totalFields: response.data.meta.totalFields,
          billableFields: response.data.meta.billableFields,
        });
      }

      return response.data;
    } catch (error) {
      this.logger.error('Deep encryption failed', error as Error);
      throw error;
    }
  }

  /**
   * Decrypts complex data structures that were encrypted using deepEncrypt
   */
  async deepDecrypt(encryptedData: any): Promise<DeepDecryptResponse['data']> {
    try {
      Validator.validateEncryptedData(encryptedData);
      const finalPassphrase = this.config.passphrase;
      
      if (!finalPassphrase) {
        throw new CipherionError('Passphrase is required', 400);
      }

      const response = await this.httpClient.post<DeepDecryptResponse>(
        `/api/v1/crypto/deep_decrypt/${this.config.projectId}`,
        { encrypted: encryptedData, passphrase: finalPassphrase }
      );

      if (this.config.enableLogging) {
        this.logger.info('Deep decryption completed successfully', {
          totalFields: response.data.meta.totalFields,
          billableFields: response.data.meta.billableFields,
        });
      }

      return response.data;
    } catch (error) {
      this.logger.error('Deep decryption failed', error as Error);
      throw error;
    }
  }

  /**
   * Migrates an array of data by encrypting each item
   * Useful for batch operations with queue and background worker patterns
   */
  async migrateEncrypt(
    dataArray: any[],
    options?: MigrationOptions
  ): Promise<MigrationResult> {
    const finalPassphrase = this.config.passphrase;
    
    if (!finalPassphrase) {
      throw new CipherionError('Passphrase is required for migration', 400);
    }

    this.logger.info('Starting encryption migration', {
      totalItems: dataArray.length,
      batchSize: options?.batchSize || 10,
    });

    const result = await this.migrationHelper.encryptMigration(
      dataArray,
      finalPassphrase,
      options
    );

    this.logger.info('Encryption migration completed', {
      successful: result.summary.successful,
      failed: result.summary.failed,
    });

    return result;
  }

  /**
   * Migrates an array of encrypted data by decrypting each item
   */
  async migrateDecrypt(
    encryptedArray: any[],
    options?: MigrationOptions
  ): Promise<MigrationResult> {
    const finalPassphrase =  this.config.passphrase;
    
    if (!finalPassphrase) {
      throw new CipherionError('Passphrase is required for migration', 400);
    }

    this.logger.info('Starting decryption migration', {
      totalItems: encryptedArray.length,
      batchSize: options?.batchSize || 10,
    });

    const result = await this.migrationHelper.decryptMigration(
      encryptedArray,
      finalPassphrase,
      options
    );

    this.logger.info('Decryption migration completed', {
      successful: result.summary.successful,
      failed: result.summary.failed,
    });

    return result;
  }

  /**
   * Gets the current configuration (without sensitive data)
   */
  getConfig(): Omit<CipherionConfig, 'apiKey' | 'passphrase'> {
    const { apiKey, passphrase, ...safeConfig } = this.config;
    return safeConfig;
  }

  /**
   * Updates the client configuration
   */
  updateConfig(newConfig: Partial<CipherionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    Validator.validateConfig(this.config);
    
    this.httpClient = new HttpClient(
      this.config.baseUrl,
      this.config.apiKey,
      this.config.timeout,
      this.logger
    );

    if (this.config.enableLogging) {
      this.logger.info('Configuration updated');
    }
  }
}