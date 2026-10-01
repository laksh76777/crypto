import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('VeriCrypt_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await authApi.getMe();
      if (res.data.success) {
        setUser(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to restore session:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    if (res.data.success && res.data.data) {
      const newToken = res.data.data.token;
      const loggedUser = res.data.data.user;
      localStorage.setItem('VeriCrypt_token', newToken);
      setToken(newToken);
      setUser(loggedUser);
    }
  };

  const register = async (name: string, email: string, password: string, role: string = 'USER') => {
    const res = await authApi.register({ name, email, password, role });
    if (res.data.success && res.data.data) {
      const newToken = res.data.data.token;
      const registeredUser = res.data.data.user;
      localStorage.setItem('VeriCrypt_token', newToken);
      setToken(newToken);
      setUser(registeredUser);
    }
  };

  const logout = () => {
    localStorage.removeItem('VeriCrypt_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
