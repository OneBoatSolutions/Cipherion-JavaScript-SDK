// src/types/api.ts

export interface BaseResponse {
  success: boolean;
  statusCode: number;
  message: string;
}

export interface EncryptResponse extends BaseResponse {
  data: {
    encrypted_output: string;
  };
}

export interface DecryptResponse extends BaseResponse {
  data: {
    plaintext: string;
  };
}


export interface EncryptionMetadata {
  excluded_fields: string[];
  excluded_patterns: string[];
  operation: string;
}

export interface DecryptionMetadata {
  excluded_fields: string[];
  excluded_patterns: string[];
  failed_fields: string[];
  fail_gracefully: boolean;
  operation: string;
}

export interface DeepEncryptResponse extends BaseResponse {
  data: {
    encrypted: any;
    meta: {
      encryptionMetadata: EncryptionMetadata;
      totalFields: number;
      billableFields: number;
      totalPrice: number;
    };
  };
}

export interface DeepDecryptResponse extends BaseResponse {
  data: {
    data: any;
    meta: {
      decryptionMetadata: DecryptionMetadata;
      totalFields: number;
      billableFields: number;
      totalPrice: number;
    };
  };
}

export interface ErrorResponse extends BaseResponse {
  error: {
    details: string;
  };
}

// Fixed: Use string[] instead of []
export interface DeepEncryptOptions {
  exclude_fields?: string[];
  exclude_patterns?: string[];
}

export interface DeepDecryptOptions {
  exclude_fields?: string[];
  exclude_patterns?: string[];
  fail_gracefully?: boolean;
}

export interface EncryptRequest {
  data: string;
  passphrase: string;
}

export interface DecryptRequest {
  data: string;
  passphrase: string;
}

export interface DeepEncryptRequest {
  data: any;
  passphrase: string;
  exclude_fields?: string[];
  exclude_patterns?: string[];
}

export interface DeepDecryptRequest {
  encrypted: any;
  passphrase: string;
  exclude_fields?: string[];
  exclude_patterns?: string[];
  fail_gracefully?: boolean;
}

// Anonymization types
export interface DetectedEntity {
  text: string;
  type: string;
  score: number;
  start: number;
  end: number;
}

export interface AnonymizeRequest {
  text: string;
  scoreThreshold?: number;
  entitiesToDetect?: string[];
  allowOverlaps?: boolean;
  contextValidation?: boolean;
}

export interface AnonymizeResponse extends BaseResponse {
  data: {
    anonymizedText: string;
    entityCount: number;
    entities: DetectedEntity[];
    statistics: {
      [key: string]: number;
    };
    processingTimeMs: number;
  };
}