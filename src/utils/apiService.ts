
/**
 * API Service Utility for the JayLink SMS Platform
 * This module handles all interactions with the SMSPROVIDER API and WordPress API
 */

import { SMS_API_CONFIG, WP_API_CONFIG } from "@/config/api";
import { WPAuthResponse, WPUser, WPPost, WPCategory, WPTag, WPMediaItem } from "@/types/wordpress";
import { AudioFile } from "@/types/audio";

// Error codes mapping as per API documentation
export const ERROR_CODES: Record<string, string> = {
  "000": "Request successful",
  "100": "Incomplete request parameters",
  "101": "Request denied",
  "110": "Login status failed",
  "111": "Login status denied",
  "120": "Message limit reached",
  "121": "Mobile limit reached",
  "122": "Sender limit reached",
  "130": "Sender prohibited",
  "131": "Message prohibited",
  "140": "Invalid price setup",
  "141": "Invalid route setup",
  "142": "Invalid schedule date",
  "150": "Insufficient funds",
  "151": "Gateway denied access",
  "152": "Service denied access",
  "160": "File upload error",
  "161": "File upload limit",
  "162": "File restricted",
  "190": "Maintenance in progress",
  "191": "Internal error"
};

// Types for API responses
export type ApiSuccessResponse = {
  status: "OK" | "success";
  count?: number;
  price?: number;
  data?: Record<string, any>;
};

export type ApiErrorResponse = {
  error: string;
  errno: string;
};

export type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

// Helper to determine if the response is an error
export const isErrorResponse = (response: ApiResponse): response is ApiErrorResponse => {
  return 'error' in response;
};

// Base function to make SMS API requests
const makeSmsApiRequest = async (params: Record<string, any>): Promise<ApiResponse> => {
  try {
    const url = new URL(SMS_API_CONFIG.BASE_URL);
    
    // Add base credentials to all requests
    const allParams = {
      username: SMS_API_CONFIG.USERNAME,
      password: SMS_API_CONFIG.PASSWORD,
      ...params
    };
    
    // Add all parameters to URL
    Object.keys(allParams).forEach(key => 
      url.searchParams.append(key, allParams[key].toString())
    );
    
    console.log(`Making SMS API request to ${url.toString()}`);
    
    // In a real implementation, this would be a fetch to the actual API
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`SMS API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error("SMS API request failed:", error);
    return {
      error: "Request failed",
      errno: "191"
    };
  }
};

// WordPress API Authentication
const getWpAuthToken = (): string | null => {
  // Get token from localStorage
  return localStorage.getItem('wp_token');
};

// Base function to make WordPress API requests
const makeWpApiRequest = async <T>(
  endpoint: string, 
  method: string = 'GET', 
  data?: any,
  requiresAuth: boolean = true
): Promise<T | null> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Add authorization header if required and token exists
    if (requiresAuth) {
      const token = getWpAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else if (endpoint !== 'jwt-auth/v1/token') {
        // Don't throw for auth endpoints
        throw new Error("Authentication required");
      }
    }
    
    const response = await fetch(`${WP_API_CONFIG.BASE_URL}${endpoint}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined
    });
    
    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("WordPress API request failed:", error);
    return null;
  }
};

// SMS API Service functions
export const smsApiService = {
  // Send SMS message
  sendSMS: (recipients: string, message: string, senderId: string, scheduleDate?: string) => {
    const params = {
      message,
      sender: senderId,
      mobiles: recipients,
      ...(scheduleDate && { schedule: scheduleDate })
    };
    
    return makeSmsApiRequest(params);
  },
  
  // Send bulk SMS
  sendBulkSMS: async (recipientsCsv: File, message: string, senderId: string, scheduleDate?: string) => {
    // Convert CSV file content to array of numbers
    const phoneNumbers = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const lines = content.split("\n").filter(line => line.trim());
        const numbers = lines.join(",");
        resolve(numbers);
      };
      reader.readAsText(recipientsCsv);
    });
    
    const params = {
      message,
      sender: senderId,
      mobiles: phoneNumbers,
      ...(scheduleDate && { schedule: scheduleDate })
    };
    
    return makeSmsApiRequest(params);
  },
  
  // Make voice call with TTS
  makeVoiceCallTTS: (recipients: string, message: string, callerId: string, scheduleDate?: string) => {
    const params = {
      message,
      sender: callerId,
      mobiles: recipients,
      type: "tts",
      ...(scheduleDate && { schedule: scheduleDate })
    };
    
    return makeSmsApiRequest(params);
  },
  
  // Make voice call with audio file
  makeVoiceCallAudio: (recipients: string, audioReference: string, callerId: string, scheduleDate?: string) => {
    const params = {
      message: audioReference,
      sender: callerId,
      mobiles: recipients,
      type: "call",
      ...(scheduleDate && { schedule: scheduleDate })
    };
    
    return makeSmsApiRequest(params);
  },
  
  // Upload audio file
  uploadAudio: async (audioFile: File, description?: string) => {
    // For this example, we'll upload to URL - in a production app you'd use FormData
    return makeSmsApiRequest({
      action: "upload",
      url: URL.createObjectURL(audioFile),
      ...(description && { description })
    });
  },
  
  // Get account balance
  getBalance: () => {
    return makeSmsApiRequest({
      action: "balance"
    });
  },
  
  // Get message history
  getMessageHistory: (page: number = 1, limit: number = 20) => {
    return makeSmsApiRequest({
      action: "history",
      page,
      limit
    });
  },
  
  // Get payment history
  getPaymentHistory: (page: number = 1, limit: number = 20) => {
    return makeSmsApiRequest({
      action: "payments",
      page,
      limit
    });
  },
  
  // Get saved audio files
  getSavedAudios: () => {
    return makeSmsApiRequest({
      action: "audios"
    });
  },
  
  // Get contact groups
  getContactGroups: () => {
    return makeSmsApiRequest({
      action: "groups"
    });
  },
  
  // Get contacts
  getContacts: () => {
    return makeSmsApiRequest({
      action: "contacts"
    });
  },
  
  // Login validation
  validateLogin: (username: string, password: string) => {
    return makeSmsApiRequest({
      username,
      password,
      action: "login"
    });
  }
};

// WordPress API Service functions
export const wpApiService = {
  // WordPress authentication
  login: async (username: string, password: string): Promise<WPAuthResponse | null> => {
    return makeWpApiRequest<WPAuthResponse>(
      'jwt-auth/v1/token', 
      'POST',
      { username, password },
      false
    );
  },
  
  // Get posts (with ACF fields if available)
  getPosts: async (page: number = 1, perPage: number = 10) => {
    return makeWpApiRequest<WPPost[]>(`wp/v2/posts?page=${page}&per_page=${perPage}&_embed=1&acf=1`);
  },
  
  // Get single post by ID
  getPost: async (id: number) => {
    return makeWpApiRequest<WPPost>(`wp/v2/posts/${id}?_embed=1&acf=1`);
  },
  
  // Create a new post
  createPost: async (title: string, content: string, acfFields?: Record<string, any>) => {
    const postData = {
      title,
      content,
      status: 'publish',
      acf: acfFields
    };
    
    return makeWpApiRequest<WPPost>('wp/v2/posts', 'POST', postData);
  },
  
  // Update a post
  updatePost: async (id: number, data: Partial<WPPost>) => {
    return makeWpApiRequest<WPPost>(`wp/v2/posts/${id}`, 'PUT', data);
  },
  
  // Delete a post
  deletePost: async (id: number) => {
    return makeWpApiRequest<{ deleted: boolean }>(`wp/v2/posts/${id}`, 'DELETE');
  },
  
  // Get current user
  getCurrentUser: async () => {
    return makeWpApiRequest<WPUser>('wp/v2/users/me');
  },

  // Get categories
  getCategories: async (page: number = 1, perPage: number = 20) => {
    return makeWpApiRequest<WPCategory[]>(`wp/v2/categories?page=${page}&per_page=${perPage}`);
  },

  // Get tags
  getTags: async (page: number = 1, perPage: number = 20) => {
    return makeWpApiRequest<WPTag[]>(`wp/v2/tags?page=${page}&per_page=${perPage}`);
  },

  // Get media items
  getMedia: async (page: number = 1, perPage: number = 20) => {
    return makeWpApiRequest<WPMediaItem[]>(`wp/v2/media?page=${page}&per_page=${perPage}`);
  },

  // Upload media
  uploadMedia: async (file: File, title?: string) => {
    // Convert file to base64
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content.split(',')[1]);
      };
      reader.readAsDataURL(file);
    });

    return makeWpApiRequest<WPMediaItem>('wp/v2/media', 'POST', {
      file: base64,
      title: title || file.name
    });
  }
};

export default { smsApiService, wpApiService };
