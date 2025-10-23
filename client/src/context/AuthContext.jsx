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
  if (process.env.NODE_ENV === "production") {
    // In production, use relative URLs for same-origin requests
    return "";
  } else {
    // In development, use localhost with correct port
    return "http://localhost:5000";
  }
};

axios.defaults.baseURL = getBaseURL();
console.log("Axios baseURL set to:", axios.defaults.baseURL);
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
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    
    if (token && isTokenValid(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (token && !isTokenValid(token)) {
      // Clean up expired token
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
    }

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
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
      console.log("Token expired or invalid, clearing auth data");
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
    console.log("Initializing authentication...");
    setIsLoading(true);

    try {
      // Check both localStorage and sessionStorage for mobile compatibility
      let token = localStorage.getItem("token");
      let tokenSource = "localStorage";

      if (!token) {
        token = sessionStorage.getItem("token");
        tokenSource = "sessionStorage";
      }

      console.log("Token source:", tokenSource);

      if (!token) {
        console.log("No token found - user not authenticated");
        setUser(null);
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }

      if (!isTokenValid(token)) {
        console.log("Token expired or invalid, clearing");
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        setUser(null);
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }

      // Decode token to get user data
      const userData = decodeToken(token);
      if (userData && userData.username && userData.role) {
        console.log("User restored from token:", userData);
        setUser(userData);

        // Ensure token is in both storages for mobile
        if (tokenSource === "localStorage") {
          sessionStorage.setItem("token", token);
        } else {
          localStorage.setItem("token", token);
        }
      } else {
        console.log(
          "Failed to decode token or invalid user data - user not authenticated"
        );
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        setUser(null);
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
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
      console.log("Login attempt for user:", username);
      setIsLoading(true);

      const response = await axios.post("/api/auth/login", { username, password });
      const { token, user: userData } = response.data;

      if (!token) {
        throw new Error("No token received from server");
      }

      // Store token in both storages for reliability
      localStorage.setItem("token", token);
      sessionStorage.setItem("token", token);

      // Decode token to get user data
      const decodedUser = decodeToken(token);
      if (decodedUser) {
        setUser(decodedUser);
        setIsLoading(false);
        setIsInitialized(true);
        console.log("Login successful for user:", decodedUser.username);
      } else {
        throw new Error("Failed to decode token");
      }

      return userData;
    } catch (error) {
      console.error("Login error:", error);
      
      // Clear any existing token on login failure
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      setUser(null);
      setIsLoading(false);
      setIsInitialized(true);

      // Provide user-friendly error messages
      let errorMessage = "Login failed. Please try again.";
      
      if (error.response?.status === 401) {
        errorMessage = "Invalid username or password. Please check your credentials.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.code === "NETWORK_ERROR" || error.message?.includes("Network Error")) {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        errorMessage = "Request timed out. Please try again.";
      }

      throw new Error(errorMessage);
    }
  };

  const logout = useCallback(() => {
    console.log("Logging out user");
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
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
      console.error("Token refresh failed:", error);
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
