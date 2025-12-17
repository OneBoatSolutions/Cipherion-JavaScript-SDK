// src/utils/migration.ts
import { CipherionClient } from '../client/CipherionClient';
import { ExclusionOptions, MigrationOptions, MigrationResult } from '../types/client';

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
      exclusionOptions,
    } = options;

    // SECURITY FIX: Validate batch size
    const safeBatchSize = Math.min(Math.max(1, batchSize), 100); // Between 1-100
    const safeDelay = Math.max(0, delayBetweenBatches); // Non-negative
    const safeRetries = Math.min(Math.max(1, maxRetries), 10); // Between 1-10

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

    for (let i = 0; i < dataArray.length; i += safeBatchSize) {
      const batch = dataArray.slice(i, i + safeBatchSize);
      const batchPromises = batch.map((item) =>
        this.processEncryptionWithRetry(item, safeRetries, exclusionOptions)
          .then((encrypted) => {
            result.successful.push(encrypted);
            result.summary.successful++;
          })
          .catch((error) => {
            const failedItem = { item, error };
            result.failed.push(failedItem);
            result.summary.failed++;
            if (onError) {
              try {
                onError(error, item);
              } catch (callbackError) {
                // Prevent callback errors from breaking migration
                console.error('Error in onError callback:', callbackError);
              }
            }
          })
          .finally(() => {
            result.summary.processed++;
            result.summary.percentage = Math.round(
              (result.summary.processed / result.summary.total) * 100
            );
            if (onProgress) {
              try {
                onProgress(result.summary);
              } catch (callbackError) {
                // Prevent callback errors from breaking migration
                console.error('Error in onProgress callback:', callbackError);
              }
            }
          })
      );

      await Promise.allSettled(batchPromises);

      // Add delay between batches to prevent rate limiting
      if (i + safeBatchSize < dataArray.length && safeDelay > 0) {
        await this.delay(safeDelay);
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
      exclusionOptions,
    } = options;

    // SECURITY FIX: Validate batch size
    const safeBatchSize = Math.min(Math.max(1, batchSize), 100);
    const safeDelay = Math.max(0, delayBetweenBatches);
    const safeRetries = Math.min(Math.max(1, maxRetries), 10);

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

    for (let i = 0; i < encryptedArray.length; i += safeBatchSize) {
      const batch = encryptedArray.slice(i, i + safeBatchSize);
      const batchPromises = batch.map((item) =>
        this.processDecryptionWithRetry(item, safeRetries, exclusionOptions)
          .then((decrypted) => {
            result.successful.push(decrypted);
            result.summary.successful++;
          })
          .catch((error) => {
            const failedItem = { item, error };
            result.failed.push(failedItem);
            result.summary.failed++;
            if (onError) {
              try {
                onError(error, item);
              } catch (callbackError) {
                console.error('Error in onError callback:', callbackError);
              }
            }
          })
          .finally(() => {
            result.summary.processed++;
            result.summary.percentage = Math.round(
              (result.summary.processed / result.summary.total) * 100
            );
            if (onProgress) {
              try {
                onProgress(result.summary);
              } catch (callbackError) {
                console.error('Error in onProgress callback:', callbackError);
              }
            }
          })
      );

      await Promise.allSettled(batchPromises);

      // Add delay between batches
      if (i + safeBatchSize < encryptedArray.length && safeDelay > 0) {
        await this.delay(safeDelay);
      }
    }

    return result;
  }

  private async processEncryptionWithRetry(
    data: any,
    maxRetries: number,
    exclusionOptions?: ExclusionOptions
  ): Promise<any> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // FIXED: Pass exclusionOptions directly as DeepEncryptOptions
        return await this.client.deepEncrypt(data, exclusionOptions);
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries) {
          // Exponential backoff with jitter to prevent thundering herd
          const baseDelay = 1000 * attempt;
          const jitter = Math.random() * 500; // 0-500ms random jitter
          await this.delay(baseDelay + jitter);
        }
      }
    }

    throw lastError!;
  }

  private async processDecryptionWithRetry(
    encryptedData: any,
    maxRetries: number,
    exclusionOptions?: ExclusionOptions
  ): Promise<any> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // FIXED: Pass exclusionOptions directly as DeepDecryptOptions
        return await this.client.deepDecrypt(encryptedData, exclusionOptions);
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries) {
          // Exponential backoff with jitter
          const baseDelay = 1000 * attempt;
          const jitter = Math.random() * 500;
          await this.delay(baseDelay + jitter);
        }
      }
    }

    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}