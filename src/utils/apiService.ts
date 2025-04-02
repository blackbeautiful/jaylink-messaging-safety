
/**
 * API Service Utility for the JayLink SMS Platform
 * This module handles all interactions with the SMSPROVIDER API and WordPress API
 */

// API Configuration - This would come from environment variables in a real app
const SMS_API_BASE_URL = "https://customer.smsprovider.com.ng/api/";
const SMS_API_USERNAME = "DEMO_USERNAME"; // Replace with real credentials in production
const SMS_API_PASSWORD = "DEMO_PASSWORD"; // Replace with real credentials in production

// WordPress API configuration
const WP_API_BASE_URL = "https://your-wordpress-site.com/wp-json/";
const WP_API_USERNAME = "DEMO_WP_USER"; // Replace with real credentials
const WP_API_PASSWORD = "DEMO_WP_PASS"; // Replace with real credentials

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
type ApiSuccessResponse = {
  status: "OK" | "success";
  count?: number;
  price?: number;
  data?: Record<string, any>;
};

type ApiErrorResponse = {
  error: string;
  errno: string;
};

type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

// WordPress types
type WPAuthToken = {
  token: string;
  user_email: string;
  user_nicename: string;
  user_display_name: string;
};

type WPPost = {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  acf?: Record<string, any>;
  [key: string]: any;
};

// Helper to determine if the response is an error
export const isErrorResponse = (response: ApiResponse): response is ApiErrorResponse => {
  return 'error' in response;
};

// Base function to make SMS API requests
const makeSmsApiRequest = async (params: Record<string, any>): Promise<ApiResponse> => {
  try {
    const url = new URL(SMS_API_BASE_URL);
    
    // Add base credentials to all requests
    const allParams = {
      username: SMS_API_USERNAME,
      password: SMS_API_PASSWORD,
      ...params
    };
    
    // Add all parameters to URL
    Object.keys(allParams).forEach(key => 
      url.searchParams.append(key, allParams[key].toString())
    );
    
    console.log(`Making SMS API request to ${url.toString()}`);
    
    // In a real implementation, this would be a fetch to the actual API
    const response = await fetch(url.toString());
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
const getWpAuthToken = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${WP_API_BASE_URL}jwt-auth/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: WP_API_USERNAME,
        password: WP_API_PASSWORD
      })
    });
    
    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }
    
    const data: WPAuthToken = await response.json();
    return data.token;
  } catch (error) {
    console.error("WordPress authentication failed:", error);
    return null;
  }
};

// Base function to make WordPress API requests
const makeWpApiRequest = async <T>(
  endpoint: string, 
  method: string = 'GET', 
  data?: any
): Promise<T | null> => {
  try {
    const token = await getWpAuthToken();
    
    if (!token) {
      throw new Error("Could not authenticate with WordPress");
    }
    
    const response = await fetch(`${WP_API_BASE_URL}wp/v2/${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
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
  // Get posts (with ACF fields if available)
  getPosts: async (page: number = 1, perPage: number = 10) => {
    return makeWpApiRequest<WPPost[]>(`posts?page=${page}&per_page=${perPage}&_embed=1&acf=1`);
  },
  
  // Get single post by ID
  getPost: async (id: number) => {
    return makeWpApiRequest<WPPost>(`posts/${id}?_embed=1&acf=1`);
  },
  
  // Create a new post
  createPost: async (title: string, content: string, acfFields?: Record<string, any>) => {
    const postData = {
      title,
      content,
      status: 'publish',
      acf: acfFields
    };
    
    return makeWpApiRequest<WPPost>('posts', 'POST', postData);
  },
  
  // Update a post
  updatePost: async (id: number, data: Partial<WPPost>) => {
    return makeWpApiRequest<WPPost>(`posts/${id}`, 'PUT', data);
  },
  
  // Delete a post
  deletePost: async (id: number) => {
    return makeWpApiRequest<{ deleted: boolean }>(`posts/${id}`, 'DELETE');
  },
  
  // Get current user
  getCurrentUser: async () => {
    return makeWpApiRequest('users/me');
  }
};

export default { smsApiService, wpApiService };
