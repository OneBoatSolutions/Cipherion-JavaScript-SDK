import { CipherionClient } from '../client/CipherionClient';
import { MigrationOptions, MigrationProgress, MigrationResult } from '../types/client';

export class MigrationHelper {
  private client: CipherionClient;

  constructor(client: CipherionClient) {
    this.client = client;
  }

  async encryptMigration(
    dataArray: any[],
    passphrase: string,
    options: MigrationOptions = {}
  ): Promise<MigrationResult> {
    const {
      batchSize = 10,
      delayBetweenBatches = 1000,
      maxRetries = 3,
      onProgress,
      onError,
    } = options;

    const result: MigrationResult = {
      successful: [],
      failed: [],
      summary: {
        total: dataArray.length,
        processed: 0,
        successful: 0,
        failed: 0,
        percentage: 0,
      },
    };

    for (let i = 0; i < dataArray.length; i += batchSize) {
      const batch = dataArray.slice(i, i + batchSize);
      const batchPromises = batch.map((item, index) =>
        this.processEncryptionWithRetry(item, passphrase, maxRetries)
          .then((encrypted) => {
            result.successful.push(encrypted);
            result.summary.successful++;
          })
          .catch((error) => {
            const failedItem = { item, error };
            result.failed.push(failedItem);
            result.summary.failed++;
            if (onError) onError(error, item);
          })
          .finally(() => {
            result.summary.processed++;
            result.summary.percentage = Math.round(
              (result.summary.processed / result.summary.total) * 100
            );
            if (onProgress) onProgress(result.summary);
          })
      );

      await Promise.allSettled(batchPromises);

      // Add delay between batches to prevent rate limiting
      if (i + batchSize < dataArray.length) {
        await this.delay(delayBetweenBatches);
      }
    }

    return result;
  }

  async decryptMigration(
    encryptedArray: any[],
    passphrase: string,
    options: MigrationOptions = {}
  ): Promise<MigrationResult> {
    const {
      batchSize = 10,
      delayBetweenBatches = 1000,
      maxRetries = 3,
      onProgress,
      onError,
    } = options;

    const result: MigrationResult = {
      successful: [],
      failed: [],
      summary: {
        total: encryptedArray.length,
        processed: 0,
        successful: 0,
        failed: 0,
        percentage: 0,
      },
    };

    for (let i = 0; i < encryptedArray.length; i += batchSize) {
      const batch = encryptedArray.slice(i, i + batchSize);
      const batchPromises = batch.map((item, index) =>
        this.processDecryptionWithRetry(item, passphrase, maxRetries)
          .then((decrypted) => {
            result.successful.push(decrypted);
            result.summary.successful++;
          })
          .catch((error) => {
            const failedItem = { item, error };
            result.failed.push(failedItem);
            result.summary.failed++;
            if (onError) onError(error, item);
          })
          .finally(() => {
            result.summary.processed++;
            result.summary.percentage = Math.round(
              (result.summary.processed / result.summary.total) * 100
            );
            if (onProgress) onProgress(result.summary);
          })
      );

      await Promise.allSettled(batchPromises);

      // Add delay between batches
      if (i + batchSize < encryptedArray.length) {
        await this.delay(delayBetweenBatches);
      }
    }

    return result;
  }

  private async processEncryptionWithRetry(
    data: any,
    passphrase: string,
    maxRetries: number
  ): Promise<any> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.client.deepEncrypt(data);
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries) {
          await this.delay(1000 * attempt); // Exponential backoff
        }
      }
    }

    throw lastError!;
  }

  private async processDecryptionWithRetry(
    encryptedData: any,
    passphrase: string,
    maxRetries: number
  ): Promise<any> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.client.deepDecrypt(encryptedData);
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries) {
          await this.delay(1000 * attempt);
        }
      }
    }

    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}