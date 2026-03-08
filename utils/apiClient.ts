import axios, { type AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';

import { API_BASE_URL } from '@/constants/api';

const TOKEN_KEY = 'findit_auth_token';

/** Called when API returns 401; use to clear session and redirect to login */
let on401Callback: (() => void | Promise<void>) | null = null;

export function setOn401Callback(callback: (() => void | Promise<void>) | null) {
  on401Callback = callback;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const url = config.baseURL && config.url ? `${config.baseURL}${config.url}` : config.url;
  console.log('[API Request]', config.method?.toUpperCase(), url, config.params ?? '', config.data ?? '');
  return config;
});

apiClient.interceptors.response.use(
  (res) => {
    const url = res.config.baseURL && res.config.url ? `${res.config.baseURL}${res.config.url}` : res.config.url;
    console.log('[API Response]', res.status, url, res.data);
    return res;
  },
  (err) => {
    const url = err.config?.baseURL && err.config?.url ? `${err.config.baseURL}${err.config.url}` : err.config?.url;
    console.log('[API Error]', err.response?.status ?? err.message, url, err.response?.data ?? err.message);
    if (err.response?.status === 401) {
      SecureStore.deleteItemAsync(TOKEN_KEY);
      if (on401Callback) {
        Promise.resolve(on401Callback()).catch(() => {});
      }
    }
    return Promise.reject(err);
  }
);
