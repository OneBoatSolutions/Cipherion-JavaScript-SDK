import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { CipherionError } from '../errors/CipherionError';
import CipherionLogger from './logger';

// Extend Axios config to include metadata
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}

export class HttpClient {
  private client: AxiosInstance;
  private logger: CipherionLogger;

  constructor(
    baseUrl: string,
    apiKey: string,
    timeout: number = 30000,
    logger: CipherionLogger
  ) {
    this.logger = logger;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        config.metadata = { startTime: Date.now() };
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - (response.config.metadata?.startTime ?? 0);
        this.logger.logApiCall(
          response.config.method?.toUpperCase() || 'UNKNOWN',
          response.config.url || '',
          response.status,
          duration
        );
        return response;
      },
      (error) => {
        if (error.config?.metadata?.startTime) {
          const duration = Date.now() - error.config.metadata.startTime;
          this.logger.logApiCall(
            error.config.method?.toUpperCase() || 'UNKNOWN',
            error.config.url || '',
            error.response?.status || 0,
            duration
          );
        }
        return Promise.reject(CipherionError.fromAxiosError(error));
      }
    );
  }

  async post<T = any>(url: string, data: any): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.post(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}