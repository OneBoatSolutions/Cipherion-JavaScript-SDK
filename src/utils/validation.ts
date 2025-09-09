import { CipherionConfig } from '../types/client';
import { CipherionError } from '../errors/CipherionError';

export class Validator {
  static validateConfig(config: CipherionConfig): void {
    if (!config.baseUrl) {
      throw new CipherionError('Base URL is required', 400);
    }
    if (!config.projectId) {
      throw new CipherionError('Project ID is required', 400);
    }
    if (!config.apiKey) {
      throw new CipherionError('API Key is required', 400);
    }
  }

  static validatePassphrase(passphrase: string): void {
    if (!passphrase || passphrase.length < 12) {
      throw new CipherionError('Passphrase must be at least 12 characters long', 400);
    }
  }

  static validateData(data: any): void {
    if (data === null || data === undefined) {
      throw new CipherionError('Data cannot be null or undefined', 400);
    }
  }

  static validateEncryptedData(encrypted: any): void {
    if (!encrypted) {
      throw new CipherionError('Encrypted data is required for decryption', 400);
    }
  }
}