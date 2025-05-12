
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { smsApiService } from "@/utils/apiService";

// Mock wpApiService since it doesn't exist in the codebase
const wpApiService = {
  login: async (username: string, password: string) => {
    // Simulate API call
    return {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: "administrator"
    };
  },
  register: async (username: string, email: string, password: string) => {
    // Simulate API call
    return {
      id: "1",
      name: username,
      email: email,
      role: "subscriber"
    };
  },
  forgotPassword: async (email: string) => {
    // Simulate API call
    return true;
  },
  validateToken: async () => {
    // Simulate API call
    return {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: "administrator"
    };
  }
};

// Define WPUser type to match the mock data
interface WPUser {
  id: string;
  name: string;
  email: string;
  role: string;
  url?: string;
  description?: string;
  link?: string;
  slug?: string;
}

interface AuthContextType {
  user: WPUser | null;
  isAuthenticated: boolean; // Add the isAuthenticated property
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  forgotPassword: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<WPUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Compute isAuthenticated based on user state
  const isAuthenticated = !!user;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const userData = await wpApiService.validateToken();
          setUser(userData as WPUser);
        }
      } catch (error) {
        console.error("Auth validation error:", error);
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const userData = await wpApiService.login(username, password);
      localStorage.setItem("token", "mock-token-value");
      setUser(userData as WPUser);
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setLoading(true);
    try {
      const userData = await wpApiService.register(username, email, password);
      localStorage.setItem("token", "mock-token-value");
      setUser(userData as WPUser);
      navigate("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  const forgotPassword = async (email: string) => {
    try {
      return await wpApiService.forgotPassword(email);
    } catch (error) {
      console.error("Forgot password error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, login, register, logout, loading, forgotPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
};
