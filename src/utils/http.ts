// src/utils/http.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { CipherionError } from '../errors/CipherionError';
import CipherionLogger from './logger';

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number;
      retryCount?: number;
    };
  }
}


export class HttpClient {
  private client: AxiosInstance;
  private logger: CipherionLogger;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;

  constructor(
    baseUrl: string,
    apiKey: string,
    timeout: number = 30000,
    logger: CipherionLogger
  ) {
    this.logger = logger;
    this.validateConfiguration(baseUrl, apiKey, timeout);
    this.client = this.createAxiosInstance(baseUrl, apiKey, timeout);
    this.setupInterceptors();
  }


  private validateConfiguration(baseUrl: string, apiKey: string, timeout: number): void {
    if (!baseUrl || typeof baseUrl !== 'string') {
      throw new CipherionError('Invalid base URL provided', 400);
    }

    if (!apiKey || typeof apiKey !== 'string') {
      throw new CipherionError('Invalid API key provided', 400);
    }

    if (timeout < 1000 || timeout > 300000) {
      throw new CipherionError('Timeout must be between 1000ms and 300000ms', 400);
    }
  }


  private createAxiosInstance(baseUrl: string, apiKey: string, timeout: number): AxiosInstance {
    return axios.create({
      baseURL: baseUrl,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'User-Agent': 'Cipherion-SDK/1.0',
      },
      httpsAgent: process.env.NODE_ENV === 'production' ? undefined : undefined,
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 600,
    });
  }


  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => this.handleRequest(config),
      (error) => {
        this.logger.error('Request interceptor error', error);
        return Promise.reject(CipherionError.fromAxiosError(error));
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => this.handleSuccessResponse(response),
      (error) => this.handleErrorResponse(error)
    );
  }


  private handleRequest(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {

    config.metadata = {
      startTime: Date.now(),
      retryCount: config.metadata?.retryCount || 0,
    };


    if (config.data) {
      this.logger.debug('Outgoing request', {
        method: config.method?.toUpperCase(),
        url: config.url,
        hasData: !!config.data,
      });
    }

    return config;
  }


  private handleSuccessResponse(response: AxiosResponse): AxiosResponse {
    const duration = Date.now() - (response.config.metadata?.startTime ?? 0);



    if (!response.data || typeof response.data !== 'object') {
      throw new CipherionError('Invalid API response format', 500);
    }

    return response;
  }


  private async handleErrorResponse(error: any): Promise<any> {
    const config = error.config;
    const retryCount = config?.metadata?.retryCount || 0;

    const cipherionError = CipherionError.fromAxiosError(error);

    if (this.shouldRetry(cipherionError, retryCount)) {
      const delay = this.calculateRetryDelay(retryCount);
      this.logger.warn(`Retrying request (attempt ${retryCount + 1}/${this.MAX_RETRIES})`, {
        delay,
      });

      await this.sleep(delay);

      // Increment retry count and retry
      config.metadata.retryCount = retryCount + 1;
      return this.client.request(config);
    }

    return Promise.reject(cipherionError);
  }


  private shouldRetry(error: CipherionError, retryCount: number): boolean {
    return retryCount < this.MAX_RETRIES && error.isRetryable();
  }


  private calculateRetryDelay(retryCount: number): number {
    const baseDelay = this.RETRY_DELAY_MS;
    const exponentialDelay = baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 500; // 0-500ms jitter
    return Math.min(exponentialDelay + jitter, 10000); // Cap at 10 seconds
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Makes a POST request
   */
  async post<T = any>(url: string, data: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      if (!url || typeof url !== 'string') {
        throw new CipherionError('Invalid URL provided', 400);
      }

      if (!data) {
        throw new CipherionError('Request data is required', 400);
      }

      const response: AxiosResponse<T> = await this.client.post(url, data, config);

      if (response.status < 200 || response.status >= 300) {
        const errorData = response.data as any;
        const errorMessage = errorData?.message || 'Unexpected response status';
        const errorDetails = errorData?.error?.details || JSON.stringify(errorData);

        throw new CipherionError(
          errorMessage,
          response.status,
          errorDetails
        );
      }

      return response.data;
    } catch (error) {

      if (error instanceof CipherionError) {
        throw error;
      }
  
      this.logger.error('POST request failed', error);
      throw CipherionError.fromAxiosError(error);
    }
  }

  getClient(): AxiosInstance {
    return this.client;
  }
}