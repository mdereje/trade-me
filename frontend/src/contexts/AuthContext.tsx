import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi, paymentsApi, usersApi } from '../services/api';
import { SubscriptionStatus, User } from '../types';

export interface RegisterData {
  email: string;
  username: string;
  fullName: string;
  password: string;
  phoneNumber?: string;
  zipCode?: string;
  city?: string;
  state?: string;
}

interface AuthContextType {
  user: User | null;
  subscription: SubscriptionStatus | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshSubscription: () => Promise<SubscriptionStatus | null>;
  isLoading: boolean;
  isAuthenticated: boolean;
  upgradeModalOpen: boolean;
  upgradeModalMessage: string;
  openUpgradeModal: (message?: string) => void;
  closeUpgradeModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeModalMessage, setUpgradeModalMessage] = useState('');

  const refreshSubscription = useCallback(async (): Promise<SubscriptionStatus | null> => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setSubscription(null);
      return null;
    }
    try {
      const status = await paymentsApi.getStatus();
      setSubscription(status);
      return status;
    } catch {
      setSubscription(null);
      return null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setUser(null);
      setSubscription(null);
      return;
    }
    try {
      const [me, sub] = await Promise.all([
        usersApi.getMe(),
        paymentsApi.getStatus().catch(() => null),
      ]);
      setUser(me);
      setSubscription(sub);
    } catch {
      localStorage.removeItem('authToken');
      setUser(null);
      setSubscription(null);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const init = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        await refreshUser();
      }
      if (active) {
        setIsLoading(false);
      }
    };
    init();
    return () => {
      active = false;
    };
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { accessToken, user: loggedInUser } = await authApi.login(email, password);
      localStorage.setItem('authToken', accessToken);
      setUser(loggedInUser);
      await refreshSubscription();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    try {
      const { accessToken, user: newUser } = await authApi.register(userData);
      localStorage.setItem('authToken', accessToken);
      setUser(newUser);
      await refreshSubscription();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setSubscription(null);
  };

  const openUpgradeModal = useCallback((message?: string) => {
    setUpgradeModalMessage(
      message ||
        'Upgrade to a Trade Me Membership ($0.99/month or $10/year) to unlock unlimited listings and trading.'
    );
    setUpgradeModalOpen(true);
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setUpgradeModalOpen(false);
  }, []);

  const value: AuthContextType = {
    user,
    subscription,
    login,
    register,
    logout,
    refreshUser,
    refreshSubscription,
    isLoading,
    isAuthenticated: !!user,
    upgradeModalOpen,
    upgradeModalMessage,
    openUpgradeModal,
    closeUpgradeModal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
