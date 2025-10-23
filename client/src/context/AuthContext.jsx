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

// Mobile-compatible token retrieval
const getStoredToken = () => {
  try {
    // Try localStorage first
    const localToken = localStorage.getItem('token');
    if (localToken && isTokenValid(localToken)) {
      return localToken;
    }
    
    // Fallback to sessionStorage for mobile browsers
    const sessionToken = sessionStorage.getItem('token');
    if (sessionToken && isTokenValid(sessionToken)) {
      return sessionToken;
    }
    
    return null;
  } catch (error) {
    console.warn('Error accessing storage:', error);
    return null;
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
let isAuthInitialized = false;
const MIN_REQUEST_INTERVAL = 500; // 500ms between requests (reduced from 2 seconds)

// Add request interceptor to ensure token is always included
axios.interceptors.request.use(
  (config) => {
    // Skip rate limiting for login requests
    if (config.url?.includes('/auth/login')) {
      const token = getStoredToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    }
    
    // Skip rate limiting for dashboard requests
    if (config.url?.includes('/dashboard/')) {
      const token = getStoredToken();
      if (token) {
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
    
            const token = getStoredToken();
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
            } else {
              // No valid token found, clear any expired tokens
              try {
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
              } catch (error) {
                console.warn('Error clearing expired tokens:', error);
              }
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
    // Reset request tracking on successful response
    isRequestInProgress = false;
    return response;
  },
  (error) => {
    // Reset request tracking on error
    isRequestInProgress = false;
    
    if (error.response?.status === 401) {
      // Token expired or invalid, clear it
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize authentication state
  const initializeAuth = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (isInitializing || isAuthInitialized) {
      console.log('Auth initialization already in progress or completed, skipping...');
      return;
    }

    // Security check: Ensure session flag exists
    const sessionFlag = sessionStorage.getItem('userSession');
    if (!sessionFlag) {
      console.log('Security check failed - no session flag, clearing auth data');
      localStorage.removeItem('token');
      sessionStorage.removeItem('userSession');
      setUser(null);
      setIsLoading(false);
      setIsInitialized(true);
      return;
    }

    try {
      isAuthInitialized = true;
      setIsInitializing(true);
      setIsLoading(true);
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.log('Auth initialization timeout - setting fallback state');
        setIsLoading(false);
        setIsInitialized(true);
        setIsInitializing(false);
      }, 5000); // 5 second timeout
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found');
        clearTimeout(timeoutId);
        setUser(null);
        return;
      }

      if (!isTokenValid(token)) {
        console.log('Token expired or invalid, clearing');
        clearTimeout(timeoutId);
        localStorage.removeItem('token');
        sessionStorage.removeItem('userSession');
        setUser(null);
        return;
      }

      // Decode token to get user data
      const userData = decodeToken(token);
      if (userData) {
        console.log('User restored from token:', userData);
        clearTimeout(timeoutId);
        setUser(userData);
        
        // Set session flag if user is valid
        sessionStorage.setItem('userSession', 'active');
        
        // Completely skip server verification to prevent loops
        console.log('Skipping server verification completely to prevent loops');
      } else {
        console.log('Failed to decode token');
        clearTimeout(timeoutId);
        localStorage.removeItem('token');
        sessionStorage.removeItem('userSession');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      clearTimeout(timeoutId);
      localStorage.removeItem('token');
      sessionStorage.removeItem('userSession');
      setUser(null);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
      setIsInitializing(false);
    }
  }, [isInitializing]);

  useEffect(() => {
    console.log('AuthContext useEffect triggered');
    
    // Check if this is a fresh browser session
    const sessionFlag = sessionStorage.getItem('userSession');
    if (!sessionFlag) {
      console.log('No session flag found - this is a fresh browser session, clearing all auth data');
      localStorage.removeItem('token');
      sessionStorage.removeItem('userSession');
      setUser(null);
      setIsLoading(false);
      setIsInitialized(true);
      return;
    }
    
    // Add a shorter delay to prevent loading issues
    const timeoutId = setTimeout(() => {
      console.log('Starting auth initialization...');
      initializeAuth();
    }, 1000); // Reduced to 1 second
    
    // Handle browser close/refresh
    const handleBeforeUnload = () => {
      console.log('Page unloading - clearing session flag');
      sessionStorage.removeItem('userSession');
    };
    
    // Handle page visibility changes for security
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Page hidden - maintaining session');
      } else {
        // Page is visible again - check if session is still valid
        const currentSessionFlag = sessionStorage.getItem('userSession');
        if (!currentSessionFlag) {
          console.log('Session flag missing on page visibility - logging out for security');
          localStorage.removeItem('token');
          sessionStorage.removeItem('userSession');
          setUser(null);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // Remove dependencies to prevent re-initialization

  const login = async (username, password) => {
    try {
      console.log('Attempting login for:', username);
      console.log('User Agent:', navigator.userAgent);
      console.log('Is Mobile:', /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
      setIsLoading(true);
      
      // Mobile browsers may need longer timeout
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const timeout = isMobile ? 30000 : 10000; // 30 seconds for mobile, 10 for desktop
      
      const response = await axios.post('/api/auth/login', { username, password }, {
        timeout: timeout
      });
      const { token, user: userData } = response.data;
      
      if (!token) {
        throw new Error('No token received from server');
      }

      console.log('Login successful, storing token and session flag');
      
      // Mobile-compatible storage with fallback
      try {
        localStorage.setItem('token', token);
        sessionStorage.setItem('userSession', 'active');
        console.log('Token stored successfully in localStorage and sessionStorage');
      } catch (storageError) {
        console.warn('localStorage failed, using sessionStorage only:', storageError);
        // Fallback to sessionStorage only for mobile browsers
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('userSession', 'active');
      }
      
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
      console.error('Login error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        userAgent: navigator.userAgent,
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      });
      // Clear any existing token on login failure
      try {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('userSession');
      } catch (storageError) {
        console.warn('Error clearing storage:', storageError);
      }
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    console.log('Logging out user - clearing all authentication data');
    try {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('userSession');
    } catch (error) {
      console.warn('Error clearing storage during logout:', error);
    }
    setUser(null);
    // Clear any cached data
    delete axios.defaults.headers.common['Authorization'];
    
    // Force redirect to login page
    window.location.href = '/login';
  }, []);

  const refreshToken = async () => {
    try {
      const token = getStoredToken();
      const sessionFlag = sessionStorage.getItem('userSession');
      
      if (!token || !isTokenValid(token) || !sessionFlag) {
        throw new Error('No valid token or session to refresh');
      }

      const response = await axios.post('/api/auth/refresh');
      const { token: newToken } = response.data;
      
      if (newToken) {
        localStorage.setItem('token', newToken);
        sessionStorage.setItem('userSession', 'active');
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
    isLoading: isLoading || isInitializing,
    isInitialized,
    login,
    logout,
    refreshToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};