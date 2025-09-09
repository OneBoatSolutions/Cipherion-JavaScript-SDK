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

export interface DeepEncryptResponse extends BaseResponse {
  data: {
    encrypted: any;
    meta: {
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
}

export interface DeepDecryptRequest {
  encrypted: any;
  passphrase: string;
}