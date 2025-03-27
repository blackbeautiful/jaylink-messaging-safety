
/**
 * API Service Utility for the JayLink SMS Platform
 * This module handles all interactions with the SMSPROVIDER API
 */

// API Configuration - This would come from environment variables in a real app
const API_BASE_URL = "https://customer.smsprovider.com.ng/api/";
const API_USERNAME = "DEMO_USERNAME"; // Replace with real credentials in production
const API_PASSWORD = "DEMO_PASSWORD"; // Replace with real credentials in production

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

// Helper to determine if the response is an error
export const isErrorResponse = (response: ApiResponse): response is ApiErrorResponse => {
  return 'error' in response;
};

// Base function to make API requests
const makeApiRequest = async (endpoint: string, params: Record<string, any>): Promise<ApiResponse> => {
  try {
    // In a real implementation, this would be a fetch request to the actual API
    // For demo purposes, we're simulating the API response
    console.log(`Making API request to ${endpoint} with params:`, params);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate success/error based on params for demo purposes
    if (params.simulate_error) {
      return {
        error: "Simulated error",
        errno: params.error_code || "101"
      };
    }
    
    // Return simulated success response
    return {
      status: "success",
      count: params.mobiles ? params.mobiles.split(',').length : 0,
      price: 2.5 * (params.mobiles ? params.mobiles.split(',').length : 1),
      data: { reference: `ref-${Math.random().toString(36).substring(2, 10)}` }
    };
  } catch (error) {
    console.error("API request failed:", error);
    return {
      error: "Request failed",
      errno: "191"
    };
  }
};

// API Service functions
export const apiService = {
  // Send SMS message
  sendSMS: (recipients: string, message: string, senderId: string, scheduleDate?: string) => {
    const params = {
      username: API_USERNAME,
      password: API_PASSWORD,
      message,
      sender: senderId,
      mobiles: recipients,
      ...(scheduleDate && { schedule: scheduleDate })
    };
    
    return makeApiRequest("", params);
  },
  
  // Send bulk SMS
  sendBulkSMS: (recipientsCsv: File, message: string, senderId: string, scheduleDate?: string) => {
    // In a real implementation, this would handle the CSV file properly
    // For demo, we're simulating the API call
    const params = {
      username: API_USERNAME,
      password: API_PASSWORD,
      message,
      sender: senderId,
      bulk: true,
      // We would process the CSV file here in a real implementation
      ...(scheduleDate && { schedule: scheduleDate })
    };
    
    return makeApiRequest("", params);
  },
  
  // Make voice call with TTS
  makeVoiceCallTTS: (recipients: string, message: string, callerId: string, scheduleDate?: string) => {
    const params = {
      username: API_USERNAME,
      password: API_PASSWORD,
      message,
      sender: callerId,
      mobiles: recipients,
      type: "tts",
      ...(scheduleDate && { schedule: scheduleDate })
    };
    
    return makeApiRequest("", params);
  },
  
  // Make voice call with audio file
  makeVoiceCallAudio: (recipients: string, audioReference: string, callerId: string, scheduleDate?: string) => {
    const params = {
      username: API_USERNAME,
      password: API_PASSWORD,
      message: audioReference,
      sender: callerId,
      mobiles: recipients,
      type: "call",
      ...(scheduleDate && { schedule: scheduleDate })
    };
    
    return makeApiRequest("", params);
  },
  
  // Upload audio file
  uploadAudio: (audioFile: File, description?: string) => {
    // In a real implementation, this would handle file upload
    // For demo, we're simulating the API call
    const params = {
      username: API_USERNAME,
      password: API_PASSWORD,
      action: "upload",
      description: description || ""
      // In real implementation, we would handle the file upload here
    };
    
    return makeApiRequest("", params);
  },
  
  // Get account balance
  getBalance: () => {
    const params = {
      username: API_USERNAME,
      password: API_PASSWORD,
      action: "balance"
    };
    
    return makeApiRequest("", params);
  },
  
  // Get message history
  getMessageHistory: (page: number = 1, limit: number = 20) => {
    const params = {
      username: API_USERNAME,
      password: API_PASSWORD,
      action: "history",
      page,
      limit
    };
    
    return makeApiRequest("", params);
  },
  
  // Get payment history
  getPaymentHistory: (page: number = 1, limit: number = 20) => {
    const params = {
      username: API_USERNAME,
      password: API_PASSWORD,
      action: "payments",
      page,
      limit
    };
    
    return makeApiRequest("", params);
  },
  
  // Get saved audio files
  getSavedAudios: () => {
    const params = {
      username: API_USERNAME,
      password: API_PASSWORD,
      action: "audios"
    };
    
    return makeApiRequest("", params);
  },
  
  // Get contact groups
  getContactGroups: () => {
    const params = {
      username: API_USERNAME,
      password: API_PASSWORD,
      action: "groups"
    };
    
    return makeApiRequest("", params);
  }
};

export default apiService;
