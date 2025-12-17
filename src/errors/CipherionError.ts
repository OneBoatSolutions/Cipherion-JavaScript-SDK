// src/errors/CipherionError.ts


export class CipherionError extends Error {
  public readonly statusCode: number;
  public readonly details?: string;
  public readonly originalError?: Error;
  public readonly timestamp: string;

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
    this.timestamp = new Date().toISOString();

    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CipherionError);
    }
    Object.setPrototypeOf(this, CipherionError.prototype);
  }

  /**
   * Creates a CipherionError from API response
   * Sanitizes response data to prevent sensitive info leakage
   */
  static fromResponse(response: any): CipherionError {
    const message = response?.message || 'Unknown API error';
    const statusCode = response?.statusCode || 500;
    const details = response?.error?.details;

    return new CipherionError(message, statusCode, details);
  }

  /**
   * Creates a CipherionError from Axios error
   * Handles network, timeout, and API errors securely
   */
  static fromAxiosError(error: any): CipherionError {
    
    if (error.response) {
      const message = error.response.data?.message || 'API request failed';
      const statusCode = error.response.status;
      const details = error.response.data?.error?.details;

      return new CipherionError(message, statusCode, details, error);
    }

    // Network error - no response received
    if (error.request) {
      return new CipherionError(
        'Network error - unable to reach server',
        0,
        'Check your internet connection and firewall settings',
        error
      );
    }

    // Request configuration error
    return new CipherionError(
      'Request configuration error',
      0,
      error.message,
      error
    );
  }

  /**
   * Converts error to a safe JSON object for logging
   * Excludes stack traces and sensitive data
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
    };
  }

  /**
   * Returns user-friendly error message
   */
  getUserMessage(): string {
    if (this.statusCode >= 500) {
      return 'An internal server error occurred. Please try again later.';
    }

    if (this.statusCode === 401 || this.statusCode === 403) {
      return 'Authentication failed. Please check your API credentials.';
    }

    if (this.statusCode === 429) {
      return 'Rate limit exceeded. Please wait before retrying.';
    }

    return this.message;
  }

  /**
   * Checks if error is retryable
   */
  isRetryable(): boolean {
    // Network errors and 5xx errors are retryable
    return this.statusCode === 0 || 
           this.statusCode === 429 ||
           (this.statusCode >= 500 && this.statusCode < 600);
  }
}