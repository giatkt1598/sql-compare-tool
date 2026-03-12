import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { httpClient } from './httpClient';

export abstract class ApiService {
  private readonly resourcePath: string;

  protected constructor(resourcePath: string) {
    this.resourcePath = resourcePath;
  }

  protected get<T>(path = '', config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      method: 'GET',
      url: this.buildUrl(path),
      ...config,
    });
  }

  protected post<T>(path = '', data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      method: 'POST',
      url: this.buildUrl(path),
      data,
      ...config,
    });
  }

  protected put<T>(path = '', data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      method: 'PUT',
      url: this.buildUrl(path),
      data,
      ...config,
    });
  }

  protected patch<T>(path = '', data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      method: 'PATCH',
      url: this.buildUrl(path),
      data,
      ...config,
    });
  }

  protected delete<T>(path = '', config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      method: 'DELETE',
      url: this.buildUrl(path),
      ...config,
    });
  }

  protected request<T>(config: AxiosRequestConfig): Promise<T> {
    return httpClient.request<T>(config).then((response) => response.data);
  }

  protected requestResponse<T>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return httpClient.request<T>(config);
  }

  protected buildUrl(path: string): string {
    if (!path) {
      return this.resourcePath;
    }

    return `${this.resourcePath}${path.startsWith('/') ? path : `/${path}`}`;
  }
}
