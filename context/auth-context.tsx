import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import type { LoginResponse } from '@/constants/api';
import {
    authService,
    type MainMerchantInfo,
    type MerchantLoginResponse,
    type SubMerchantInfo,
} from '@/services/authService';

const AUTH_TOKEN_KEY = '@findit_auth_token';
const AUTH_USER_KEY = '@findit_auth_user';
const SECURE_TOKEN_KEY = 'findit_auth_token'; // used by apiClient

export type UserRole = 'MERCHANT' | 'SUBMERCHANT';

export type AuthUser = {
  userId: string;
  username: string;
  email?: string;
  phone?: string;
  role: UserRole;
  userStatus?: string;
  merchantId?: number;
  mainMerchantInfo?: MainMerchantInfo;
  subMerchantId?: number;
  subMerchantInfo?: SubMerchantInfo;
  /** Profile image filename for image show API (type=profile); from login/API response */
  profileImage?: string | null;
  /** Profile image URI (local); set via Change profile image */
  profileImageUri?: string | null;
};

type AuthContextValue = {
  isLoading: boolean;
  isSignedIn: boolean;
  token: string | null;
  user: AuthUser | null;
  /** Merchant app login - calls API, stores token and user in AsyncStorage */
  login: (username: string, password: string) => Promise<void>;
  signIn: (data: LoginResponse) => Promise<void>;
  signOut: () => Promise<void>;
  /** Update profile (name, email, phone, profile image, merchant info); persists to AsyncStorage */
  updateProfile: (updates: {
    username?: string;
    email?: string;
    phone?: string;
    profileImage?: string | null;
    profileImageUri?: string | null;
    mainMerchantInfo?: Partial<MainMerchantInfo>;
    subMerchantInfo?: Partial<SubMerchantInfo>;
  }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const loadStoredAuth = useCallback(async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(AUTH_USER_KEY),
      ]);
      if (storedToken && storedUser) {
        await SecureStore.setItemAsync(SECURE_TOKEN_KEY, storedToken);
        setToken(storedToken);
        setUser(JSON.parse(storedUser) as AuthUser);
      } else {
        await SecureStore.deleteItemAsync(SECURE_TOKEN_KEY);
        setToken(null);
        setUser(null);
      }
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  /** Merchant app login - calls /api/merchant-app/login, stores token and user */
  const login = useCallback(async (username: string, password: string) => {
    const { data } = await authService.merchantLogin({ username, password });
    const loginRes = data as MerchantLoginResponse;
    if (loginRes.status !== 'success' && loginRes.status !== 'SUCCESS') {
      const msg =
        (data as { responseMessage?: string }).responseMessage?.trim() ??
        (data as { fieldErrors?: Array<{ message?: string }> }).fieldErrors?.[0]?.message?.trim() ??
        'Login failed';
      throw new Error(msg);
    }
    const role = (loginRes.role === 'SUBMERCHANT' ? 'SUBMERCHANT' : 'MERCHANT') as UserRole;
    // Support both top-level and nested: MERCHANT → merchantId (5), SUBMERCHANT → subMerchantId (1)
    const merchantId = loginRes.merchantId ?? loginRes.mainMerchantInfo?.merchantId;
    const subMerchantId = loginRes.subMerchantId ?? loginRes.subMerchantInfo?.subMerchantId;
    const profilePic =
      loginRes.profileImageUrl?.trim() ||
      loginRes.profileImage?.trim() ||
      loginRes.mainMerchantInfo?.profileImage?.trim() ||
      loginRes.subMerchantInfo?.profileImage?.trim() ||
      '';
    const userData: AuthUser = {
      userId: String(loginRes.userId),
      username: loginRes.username,
      email: loginRes.mainMerchantInfo?.merchantEmail ?? loginRes.subMerchantInfo?.merchantEmail,
      phone: loginRes.mainMerchantInfo?.merchantPhoneNumber ?? loginRes.subMerchantInfo?.merchantPhoneNumber,
      role,
      userStatus: loginRes.userStatus,
      merchantId,
      mainMerchantInfo: loginRes.mainMerchantInfo,
      subMerchantId,
      subMerchantInfo: loginRes.subMerchantInfo,
      profileImage: profilePic.length > 0 ? profilePic : null,
    };
    await Promise.all([
      AsyncStorage.setItem(AUTH_TOKEN_KEY, loginRes.token),
      AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData)),
      SecureStore.setItemAsync(SECURE_TOKEN_KEY, loginRes.token),
    ]);
    setToken(loginRes.token);
    setUser(userData);
  }, []);

  const signIn = useCallback(async (data: LoginResponse) => {
    const role = (data.role === 'SUB_MERCHANT' || data.role === 'SUBMERCHANT' ? 'SUBMERCHANT' : 'MERCHANT') as UserRole;
    const userData: AuthUser = {
      userId: String(data.userId),
      username: data.username,
      email: (data as unknown as { email?: string }).email,
      role,
      userStatus: data.userStatus,
    };
    await Promise.all([
      AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token),
      AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData)),
    ]);
    setToken(data.token);
    setUser(userData);
  }, []);

  const signOut = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(AUTH_TOKEN_KEY),
      AsyncStorage.removeItem(AUTH_USER_KEY),
      SecureStore.deleteItemAsync(SECURE_TOKEN_KEY),
    ]);
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (updates: {
    username?: string;
    email?: string;
    phone?: string;
    profileImage?: string | null;
    profileImageUri?: string | null;
    mainMerchantInfo?: Partial<MainMerchantInfo>;
    subMerchantInfo?: Partial<SubMerchantInfo>;
  }) => {
    setUser((prev) => {
      if (!prev) return null;
      const { mainMerchantInfo: mainUp, subMerchantInfo: subUp, ...rest } = updates;
      const next = { ...prev, ...rest } as AuthUser;
      if (mainUp != null) {
        next.mainMerchantInfo = { ...prev.mainMerchantInfo, ...mainUp } as MainMerchantInfo;
      }
      if (subUp != null) {
        next.subMerchantInfo = { ...prev.subMerchantInfo, ...subUp } as SubMerchantInfo;
      }
      AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value: AuthContextValue = {
    isLoading,
    isSignedIn: !!token,
    token,
    user,
    login,
    signIn,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
