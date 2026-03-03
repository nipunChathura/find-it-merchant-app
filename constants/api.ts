import { Platform } from 'react-native';

/**
 * Set this when testing on a physical device (app and server on different machines).
 * Example: 'http://192.168.1.5:9090/find-it'
 */
const API_BASE_URL_OVERRIDE: string | null = null;

/**
 * API base URL.
 * - iOS simulator / web: localhost
 * - Android emulator: 10.0.2.2 (host machine)
 * - Physical device: set API_BASE_URL_OVERRIDE to your computer's IP
 */
const getApiBaseUrl = (): string => {
  if (API_BASE_URL_OVERRIDE) return API_BASE_URL_OVERRIDE;
  if (__DEV__ && Platform.OS === 'android') {
    return 'http://10.0.2.2:9090/find-it';
  }
  return 'http://localhost:9090/find-it';
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  login: '/api/users/login',
} as const;

export interface LoginRequestBody {
  username: string;
  password: string;
}

export interface LoginResponse {
  isSystemUser: string;
  responseCode: string;
  responseMessage: string;
  role: string;
  status: string;
  token: string;
  userId: number;
  userStatus: string;
  username: string;
}
