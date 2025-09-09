export class CipherionError extends Error {
  public readonly statusCode: number;
  public readonly details?: string;
  public readonly originalError?: Error;

  constructor(
    message: string,
    statusCode: number = 500,
    details?: string,
    originalError?: Error
  ) {
    super(message);
    this.name = 'CipherionError';
    this.statusCode = statusCode;
    this.details = details;
    this.originalError = originalError;
  }

  static fromResponse(response: any): CipherionError {
    return new CipherionError(
      response.message || 'Unknown API error',
      response.statusCode || 500,
      response.error?.details
    );
  }

  static fromAxiosError(error: any): CipherionError {
    if (error.response) {
      return new CipherionError(
        error.response.data?.message || 'API request failed',
        error.response.status,
        error.response.data?.error?.details,
        error
      );
    } else if (error.request) {
      return new CipherionError(
        'Network error - no response received',
        0,
        undefined,
        error
      );
    } else {
      return new CipherionError(
        'Request setup error',
        0,
        error.message,
        error
      );
    }
  }
}