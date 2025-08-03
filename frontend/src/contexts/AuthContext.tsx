import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services';
import { User, LoginCredentials, RegisterData } from '../types';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<User | null>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  updateUser: (user: User) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    () => localStorage.getItem('accessToken')
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    () => localStorage.getItem('refreshToken')
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Setup automatic token refresh
  useEffect(() => {
    if (accessToken) {
      authService.setupTokenRefresh();
    }
  }, [accessToken]);

  // Fetch user profile if token exists
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (accessToken) {
        setLoading(true);
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          // Token might be invalid, clear everything
          await logout();
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [accessToken]);

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await authService.login(credentials);
      setUser(userData);
      
      // Get tokens from authService
      const tokens = authService.getTokens();
      if (tokens) {
        setAccessToken(tokens.accessToken);
        setRefreshToken(tokens.refreshToken);
      }
      
      setLoading(false);
      return userData;
    } catch (error: any) {
      const errorMessage = error?.message || 'فشل تسجيل الدخول';
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  };

  const register = async (data: RegisterData) => {
    setLoading(true);
    setError(null);
    try {
      const success = await authService.register(data);
      if (success) {
        // Auto-login after successful registration
        const loginData: LoginCredentials = {
          email: data.email,
          password: data.password
        };
        const userData = await login(loginData);
        setLoading(false);
        return !!userData;
      }
      setLoading(false);
      return false;
    } catch (error: any) {
      const errorMessage = error?.message || 'فشل إنشاء الحساب';
      setError(errorMessage);
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all authentication state
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      setError(null);
      
      // Clear all stored data
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear any cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Navigate to landing page
      navigate('/', { replace: true });
    }
  };

  const clearError = () => {
    setError(null);
  };

  const isAuthenticated = !!user && !!accessToken;

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        loading,
        error,
        login,
        register,
        logout,
        isAuthenticated,
        updateUser: setUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 