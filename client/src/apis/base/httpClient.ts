import axios, { AxiosError } from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

function toErrorMessage(error: AxiosError): string {
  if (error.message.toLowerCase().includes('invalid string length')) {
    return 'Data too large, failed to load';
  }

  if (error.code === 'ECONNABORTED') {
    return 'Request timed out';
  }

  const responseData = error.response?.data;
  if (typeof responseData === 'string' && responseData.trim() !== '') {
    try {
      const parsed = JSON.parse(responseData) as { message?: unknown };
      if (typeof parsed.message === 'string' && parsed.message.trim() !== '') {
        return parsed.message;
      }
    } catch {
      return responseData;
    }
  }

  if (
    responseData &&
    typeof responseData === 'object' &&
    'message' in responseData &&
    typeof responseData.message === 'string' &&
    responseData.message.trim() !== ''
  ) {
    if (responseData.message.toLowerCase().includes('invalid string length')) {
      return 'Data too large, failed to load';
    }
    return responseData.message;
  }

  return error.message || 'API request failed';
}

const API_TIMEOUT_MS = Number.parseInt(import.meta.env.VITE_API_TIMEOUT_MS ?? '120000', 10);

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: Number.isFinite(API_TIMEOUT_MS) ? API_TIMEOUT_MS : 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      return Promise.reject(new Error(toErrorMessage(error)));
    }

    return Promise.reject(
      error instanceof Error ? error : new Error('Unexpected API request error')
    );
  }
);
