/**
 * AuthContext - user, role, login(), logout()
 * Persists mock JWT and user in AsyncStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const AUTH_TOKEN_KEY = '@findit_auth_token';
const AUTH_USER_KEY = '@findit_auth_user';

export type UserRole = 'Merchant' | 'Sub Merchant';

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextValue {
  isLoading: boolean;
  isSignedIn: boolean;
  token: string | null;
  user: AuthUser | null;
  login: (email: string, password: string, role: UserRole, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}

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
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
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

  const login = useCallback(
    async (email: string, _password: string, role: UserRole, name?: string) => {
      const mockToken = `mock_jwt_${Date.now()}`;
      const userData: AuthUser = {
        userId: String(Date.now()),
        email,
        name: name || email.split('@')[0],
        role,
      };
      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, mockToken),
        AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData)),
      ]);
      setToken(mockToken);
      setUser(userData);
    },
    []
  );

  const logout = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(AUTH_TOKEN_KEY),
      AsyncStorage.removeItem(AUTH_USER_KEY),
    ]);
    setToken(null);
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    isLoading,
    isSignedIn: !!token,
    token,
    user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
