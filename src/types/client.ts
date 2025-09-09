export interface CipherionConfig {
  baseUrl: string;
  projectId: string;
  apiKey: string;
  passphrase: string;
  timeout?: number;
  retries?: number;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
  enableLogging?: boolean;
}

export interface MigrationOptions {
  batchSize?: number;
  delayBetweenBatches?: number;
  maxRetries?: number;
  onProgress?: (progress: MigrationProgress) => void;
  onError?: (error: Error, item: any) => void;
}

export interface MigrationProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  percentage: number;
}

export interface MigrationResult {
  successful: any[];
  failed: Array<{ item: any; error: Error }>;
  summary: MigrationProgress;
}