import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";

// Configure axios defaults with mobile-friendly settings
const getBaseURL = () => {
  // Use empty string to leverage Vite proxy in development
  // Vite proxy will forward /api requests to http://localhost:5000
  return "";
};

axios.defaults.baseURL = getBaseURL();
axios.defaults.timeout = 30000; // 30 second timeout for mobile
axios.defaults.headers.common["Content-Type"] = "application/json";
axios.defaults.headers.common["Accept"] = "application/json";

// JWT token utilities
const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch {
    return false;
  }
};

const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};

// Simplified request interceptor for better reliability
axios.interceptors.request.use(
  (config) => {
    // Skip token handling for login requests
    if (config.url?.includes("/auth/login")) {
      return config;
    }

    // Get token from storage
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (token) {
      // Always send token if it exists, let server validate it
      // This handles cases where client-side validation might be too strict
      config.headers.Authorization = `Bearer ${token}`;

      // Only clean up if token is clearly invalid (malformed)
      if (!isTokenValid(token)) {
        console.warn(
          "Token validation failed, but sending anyway. Server will decide."
        );
        // Don't remove token here - let server response handle it
      }
    } else {
      console.warn("No token found in storage for request to:", config.url);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
    }

    return Promise.reject(error);
  }
);

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize authentication state
  const initializeAuth = useCallback(async () => {
    setIsLoading(true);

    try {
      // Check both localStorage and sessionStorage for mobile compatibility
      let token = localStorage.getItem("token");
      let userData = localStorage.getItem("user");
      let tokenSource = "localStorage";

      if (!token) {
        token = sessionStorage.getItem("token");
        userData = sessionStorage.getItem("user");
        tokenSource = "sessionStorage";
      }

      if (!token) {
        setUser(null);
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }

      if (!isTokenValid(token)) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        setUser(null);
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }

      // Use stored user data if available
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // Ensure data is in both storages for mobile
        if (tokenSource === "localStorage") {
          sessionStorage.setItem("token", token);
          sessionStorage.setItem("user", userData);
        } else {
          localStorage.setItem("token", token);
          localStorage.setItem("user", userData);
        }
      } else {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        setUser(null);
      }
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
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
      setIsLoading(true);

      const response = await axios.post("/api/auth/login", {
        username,
        password,
      });
      const { token, user: userData } = response.data;

      if (!token || !userData) {
        throw new Error("No token or user data received from server");
      }

      // Store token and user data in both storages for reliability
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("user", JSON.stringify(userData));

      // Set user state with full user data from server
      setUser(userData);
      setIsLoading(false);
      setIsInitialized(true);

      return userData;
    } catch (error) {
      // Clear any existing data on login failure
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      setUser(null);
      setIsLoading(false);
      setIsInitialized(true);

      // Provide user-friendly error messages
      let errorMessage = "Login failed. Please try again.";

      if (error.response?.status === 401) {
        errorMessage =
          "Invalid username or password. Please check your credentials.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (
        error.code === "NETWORK_ERROR" ||
        error.message?.includes("Network Error")
      ) {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (
        error.code === "ECONNABORTED" ||
        error.message?.includes("timeout")
      ) {
        errorMessage = "Request timed out. Please try again.";
      }

      throw new Error(errorMessage);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setUser(null);
    setIsLoading(false);
    setIsInitialized(false);
    // Clear any cached data
    delete axios.defaults.headers.common["Authorization"];

    // Force redirect to login page
    window.location.href = "/login";
  }, []);

  const refreshToken = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token || !isTokenValid(token)) {
        throw new Error("No valid token to refresh");
      }

      const response = await axios.post("/api/auth/refresh");
      const { token: newToken } = response.data;

      if (newToken) {
        localStorage.setItem("token", newToken);
        const userData = decodeToken(newToken);
        if (userData) {
          setUser(userData);
        }
        return newToken;
      }
    } catch (error) {
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
    isInitialized,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
