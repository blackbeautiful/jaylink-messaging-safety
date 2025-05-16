import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader2 } from "lucide-react";

// Create an axios instance for API calls
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interface definitions
interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  phone?: string;
  role: string;
  status: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, password: string) => Promise<boolean>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  company?: string;
  phone?: string;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | null>(null);

// Auth provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();

  // Compute isAuthenticated and isAdmin based on user state
  const isAuthenticated = !!user;
  const isAdmin = user?.role === "admin";

  // Check if user is authenticated on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setUser(null);
          setLoading(false);
          setInitialized(true);
          return;
        }

        const response = await api.get("/auth/me");
        if (response.data.success) {
          setUser(response.data.data.user);
        } else {
          // If unsuccessful, clear token and user
          localStorage.removeItem("token");
          setUser(null);
        }
      } catch (error) {
        console.error("Auth validation error:", error);
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        localStorage.setItem("token", token);
        setUser(user);
        navigate("/dashboard");
        return;
      }
      
      throw new Error("Login failed");
    } catch (error) {
      console.error("Login error:", error);
      localStorage.removeItem("token");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData: RegisterData) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/register", userData);
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        // Just store the token but don't automatically log in
        localStorage.setItem("token", token);
        
        // Don't set the user here, we want them to log in explicitly
        // setUser(user);
        
        // Navigate to login instead of dashboard
        navigate("/login");
        return;
      }
      
      throw new Error("Registration failed");
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await api.post("/auth/logout");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear token and user state
      localStorage.removeItem("token");
      setUser(null);
      
      // Force navigation to login page
      navigate("/login", { replace: true });
    }
  };

  // Forgot password function
  const forgotPassword = async (email: string) => {
    try {
      const response = await api.post("/auth/forgot-password", { email });
      return response.data.success;
    } catch (error) {
      console.error("Forgot password error:", error);
      throw error;
    }
  };

  // Reset password function
  const resetPassword = async (token: string, password: string) => {
    try {
      const response = await api.post("/auth/reset-password", { token, password });
      return response.data.success;
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  };

  // Provide auth context
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        login,
        register,
        logout,
        loading,
        forgotPassword,
        resetPassword,
      }}
    >
      {initialized ? children :
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
          <Loader2 className="h-8 w-8 animate-spin text-jaylink-600 dark:text-jaylink-400" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      }
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Export the API instance for use in other components
export { api };