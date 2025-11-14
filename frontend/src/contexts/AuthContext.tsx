import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface RegisterData {
  email: string;
  username: string;
  fullName: string;
  password: string;
  phoneNumber?: string;
  zipCode?: string;
  city?: string;
  state?: string;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth token on mount
    const token = localStorage.getItem('authToken');
    if (token) {
      // Validate token and get user data
      validateToken(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      // TODO: Implement token validation with backend
      // For now, just set loading to false
      setIsLoading(false);
    } catch (error) {
      localStorage.removeItem('authToken');
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      // TODO: Implement login API call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('authToken', data.access_token);
        // TODO: Set user data from response
        setUser({
          id: 1,
          email,
          username: email.split('@')[0],
          fullName: 'User',
          isActive: true,
          createdAt: new Date().toISOString(),
        });
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      const payload = {
        email: userData.email,
        username: userData.username,
        full_name: userData.fullName,
        password: userData.password,
        phone_number: userData.phoneNumber,
        zip_code: userData.zipCode,
        city: userData.city,
        state: userData.state,
      };
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('authToken', data.access_token);
        setUser({
          id: data.user.id,
          email: data.user.email,
          username: data.user.username,
          fullName: data.user.full_name,
          phoneNumber: data.user.phone_number,
          phoneVerified: data.user.phone_verified,
          zipCode: data.user.zip_code,
          city: data.user.city,
          state: data.user.state,
          bio: data.user.bio,
          profilePicture: data.user.profile_picture,
          isActive: data.user.is_active,
          isVerified: data.user.is_verified,
          createdAt: data.user.created_at,
          lastLogin: data.user.last_login,
        });
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
