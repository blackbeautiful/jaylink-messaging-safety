// src/config/api.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { toast } from 'sonner';

// Base API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// API configuration types
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

// Response interface for better type safety
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: any;
}

// Default API configuration
const defaultConfig: ApiConfig = {
  baseURL: API_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
};

// Create API instance factory function
const createApiInstance = (
  config: ApiConfig = defaultConfig,
  tokenName: string = 'token',
  enableInterceptors: boolean = true
): AxiosInstance => {
  const instance = axios.create(config);

  // Request interceptor to add token if available
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem(tokenName);
      if (token) {
        // Use setHeader method for type safety with newer Axios versions
        config.headers.set('Authorization', `Bearer ${token}`);
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(error)
  );

  // Response interceptor for error handling
  if (enableInterceptors) {
    instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        // Extract response data
        const response = error.response;

        // Handle authentication errors (401/403)
        if (response?.status === 401 || response?.status === 403) {
          localStorage.removeItem(tokenName);

          // Only show toast if it's not a login endpoint
          const isLoginEndpoint = error.config?.url?.includes('/login');
          if (!isLoginEndpoint) {
            toast.error('Your session has expired. Please log in again.');

            // Redirect to login page after a short delay
            setTimeout(() => {
              window.location.href = '/login';
            }, 1500);
          }
        }

        // Handle server errors
        if (response?.status && response.status >= 500) {
          toast.error('Server error. Please try again later.');
        }

        return Promise.reject(error);
      }
    );
  }

  return instance;
};

// Create standard API instances for different authentication contexts
export const api = createApiInstance(defaultConfig, 'token');
export const adminApi = createApiInstance(defaultConfig, 'adminToken');

// Utility functions for common API operations
export const apiUtils = {
  /**
   * Handle API errors consistently
   */
  handleError: (error: any, defaultMessage: string = 'An error occurred'): string => {
    if (axios.isAxiosError(error)) {
      const response = error.response;
      // Check if the response has a data object with message or errors
      if (response?.data) {
        if (response.data.message) {
          return response.data.message;
        }
        if (response.data.error?.details) {
          // Join validation error messages if available
          if (Array.isArray(response.data.error.details)) {
            return response.data.error.details.map((detail: any) => detail.message).join(', ');
          }
          return response.data.error.details;
        }
      }
      return error.message || defaultMessage;
    }
    return error?.message || defaultMessage;
  },

  /**
   * Extract response data with type safety
   */
  extractData: <T>(response: AxiosResponse): T => {
    return response.data.data;
  },

  /**
   * Create API endpoints
   */
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      forgotPassword: '/auth/forgot-password',
      resetPassword: '/auth/reset-password',
      me: '/auth/me',
      logout: '/auth/logout',
    },
    admin: {
      login: '/admin/auth/login',
      me: '/admin/auth/me',
      users: '/admin/users',
      serviceCosts: '/admin/service-costs',
      balance: '/admin/balance',
      transactions: '/admin/transactions',
      analytics: '/admin/analytics',
      settings: '/admin/settings',
    },
    user: {
      profile: '/users/profile',
      password: '/users/password',
      settings: '/users/settings',
      profileSettings: '/users/profile-settings',
      sms: '/sms',
      voice: '/voice',
      balance: '/balance',
      groups: '/groups',
      scheduled: '/scheduled',
      analytics: '/analytics',
      topup: '/balance/topup',
    },
  },
};

export default {
  api,
  adminApi,
  apiUtils,
  API_URL,
};
