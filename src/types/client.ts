// src/types/client.ts

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


export interface ExclusionOptions {
  exclude_fields?: string[];
  exclude_patterns?: string[];
  fail_gracefully?: boolean;
}

export interface MigrationOptions {
  batchSize?: number;
  delayBetweenBatches?: number;
  maxRetries?: number;
  onProgress?: (progress: MigrationProgress) => void;
  onError?: (error: Error, item: any) => void;
  exclusionOptions?: ExclusionOptions;
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