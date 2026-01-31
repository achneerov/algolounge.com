import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User, AuthResponse } from '../types';
import { authApi } from '../api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem(TOKEN_KEY);
  });

  const handleAuthResponse = useCallback((response: AuthResponse) => {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    setUser(response.user);
    setIsAuthenticated(true);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.signIn(email, password);
    handleAuthResponse(response);
  }, [handleAuthResponse]);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const response = await authApi.signUp(username, email, password);
    handleAuthResponse(response);
  }, [handleAuthResponse]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
