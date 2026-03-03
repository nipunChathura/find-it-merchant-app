import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import type { LoginResponse } from '@/constants/api';

const AUTH_TOKEN_KEY = 'findit_auth_token';
const AUTH_USER_KEY = 'findit_auth_user';

type AuthUser = Pick<LoginResponse, 'userId' | 'username' | 'role' | 'userStatus'>;

type AuthContextValue = {
  isLoading: boolean;
  isSignedIn: boolean;
  token: string | null;
  user: AuthUser | null;
  signIn: (data: LoginResponse) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const loadStoredAuth = useCallback(async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        SecureStore.getItemAsync(AUTH_TOKEN_KEY),
        SecureStore.getItemAsync(AUTH_USER_KEY),
      ]);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser) as AuthUser);
      } else {
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

  const signIn = useCallback(async (data: LoginResponse) => {
    const userData: AuthUser = {
      userId: data.userId,
      username: data.username,
      role: data.role,
      userStatus: data.userStatus,
    };
    await Promise.all([
      SecureStore.setItemAsync(AUTH_TOKEN_KEY, data.token),
      SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(userData)),
    ]);
    setToken(data.token);
    setUser(userData);
  }, []);

  const signOut = useCallback(async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
      SecureStore.deleteItemAsync(AUTH_USER_KEY),
    ]);
    setToken(null);
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    isLoading,
    isSignedIn: !!token,
    token,
    user,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
