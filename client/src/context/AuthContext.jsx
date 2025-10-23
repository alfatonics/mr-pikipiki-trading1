import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Configure axios defaults
axios.defaults.baseURL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

// JWT token utilities
const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch {
    return false;
  }
};

const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

// Global request tracking to prevent loops
let isRequestInProgress = false;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 500;

// Add request interceptor to ensure token is always included
axios.interceptors.request.use(
  (config) => {
    // Skip rate limiting for login requests
    if (config.url?.includes('/auth/login')) {
      const token = localStorage.getItem('token');
      if (token && isTokenValid(token)) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    }
    
    // Skip rate limiting for dashboard requests
    if (config.url?.includes('/dashboard/')) {
      const token = localStorage.getItem('token');
      if (token && isTokenValid(token)) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    }
    
    // Block ALL authentication verification requests
    if (config.url?.includes('/auth/verify')) {
      console.log('Blocking auth verification request to prevent loops');
      return Promise.reject(new Error('Auth verification blocked'));
    }
    
    const now = Date.now();
    
    // Block requests if one is already in progress (but allow dashboard requests)
    if (isRequestInProgress && !config.url?.includes('/dashboard/')) {
      console.log('Blocking request: Another request is in progress');
      return Promise.reject(new Error('Request already in progress'));
    }
    
    // Block requests if they're too frequent (but allow dashboard requests)
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL && !config.url?.includes('/dashboard/')) {
      console.log('Blocking request: Too frequent requests');
      return Promise.reject(new Error('Request too frequent'));
    }
    
    // Mark request as in progress
    isRequestInProgress = true;
    lastRequestTime = now;
    
    const token = localStorage.getItem('token');
    if (token && isTokenValid(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (token && !isTokenValid(token)) {
      // Token expired, remove it
      localStorage.removeItem('token');
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => {
    isRequestInProgress = false;
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
axios.interceptors.response.use(
  (response) => {
    isRequestInProgress = false;
    return response;
  },
  (error) => {
    isRequestInProgress = false;
    
    if (error.response?.status === 401) {
      console.log('Token expired or invalid, clearing auth data');
      localStorage.removeItem('token');
      // Don't redirect here, let the component handle it
    }
    
    return Promise.reject(error);
  }
);

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize authentication state
  const initializeAuth = useCallback(async () => {
    console.log('Initializing authentication...');
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found - user not authenticated');
        setUser(null);
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }

      if (!isTokenValid(token)) {
        console.log('Token expired or invalid, clearing');
        localStorage.removeItem('token');
        setUser(null);
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }

      // Decode token to get user data
      const userData = decodeToken(token);
      if (userData && userData.username && userData.role) {
        console.log('User restored from token:', userData);
        setUser(userData);
      } else {
        console.log('Failed to decode token or invalid user data - user not authenticated');
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (username, password) => {
    try {
      console.log('=== LOGIN ATTEMPT START ===');
      console.log('Username:', username);
      console.log('User Agent:', navigator.userAgent);
      console.log('Is Mobile:', /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
      console.log('Base URL:', axios.defaults.baseURL);
      console.log('Current URL:', window.location.href);
      setIsLoading(true);
      
      // Mobile browsers may need longer timeout
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const timeout = isMobile ? 30000 : 10000; // 30 seconds for mobile, 10 for desktop
      
      console.log('Making login request with timeout:', timeout);
      const response = await axios.post('/api/auth/login', { username, password }, {
        timeout: timeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Login response received:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      const { token, user: userData } = response.data;
      
      if (!token) {
        throw new Error('No token received from server');
      }

      console.log('Login successful, storing token');
      localStorage.setItem('token', token);
      
      // Decode token to get user data
      const decodedUser = decodeToken(token);
      if (decodedUser) {
        console.log('Setting user state:', decodedUser);
        setUser(decodedUser);
        console.log('User state updated successfully');
      } else {
        throw new Error('Failed to decode token');
      }
      
      console.log('Login process completed successfully');
      return userData;
    } catch (error) {
      console.error('=== LOGIN ERROR ===');
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('User Agent:', navigator.userAgent);
      console.error('Is Mobile:', /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
      console.error('Network status:', navigator.onLine);
      console.error('Base URL:', axios.defaults.baseURL);
      
      // Clear any existing token on login failure
      localStorage.removeItem('token');
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    console.log('Logging out user');
    localStorage.removeItem('token');
    setUser(null);
    // Clear any cached data
    delete axios.defaults.headers.common['Authorization'];
    
    // Force redirect to login page
    window.location.href = '/login';
  }, []);

  const refreshToken = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token || !isTokenValid(token)) {
        throw new Error('No valid token to refresh');
      }

      const response = await axios.post('/api/auth/refresh');
      const { token: newToken } = response.data;
      
      if (newToken) {
        localStorage.setItem('token', newToken);
        const userData = decodeToken(newToken);
        if (userData) {
          setUser(userData);
        }
        return newToken;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      throw error;
    }
  };

  const value = {
    user,
    login,
    logout,
    refreshToken,
    isLoading,
    isInitialized
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};