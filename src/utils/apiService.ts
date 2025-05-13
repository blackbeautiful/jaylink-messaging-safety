// Type definitions for API parameters and responses
interface SendSMSParams {
  recipients: string;
  message: string;
  senderId?: string;
  scheduled?: string;
}

interface SendAudioParams {
  recipients: string;
  audioUrl: string;
  senderId?: string;
  scheduled?: string;
}

interface CallParams {
  recipients: string;
  message?: string;
  scheduled?: string;
}

interface BalanceResponse {
  balance: number;
  currency: string;
  lastUpdated: string;
}

interface MessageResponse {
  messageId: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  recipients: number;
  cost: number;
  success?: boolean;
  message?: string;
}

// Helper to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const smsApiService = {
  // Send SMS message
  sendSMS: async (params: SendSMSParams): Promise<MessageResponse> => {
    try {
      // Log for debugging
      console.log('Sending SMS:', params);
      
      // Simulate API delay
      await delay(1000);
      
      // Simulate API response
      const recipientCount = params.recipients.split(',').length;
      
      return {
        messageId: `msg_${Date.now()}`,
        status: 'queued',
        recipients: recipientCount,
        cost: recipientCount * 0.03, // $0.03 per message
        success: true,
        message: 'Message sent successfully'
      };
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  },
  
  // Send audio message
  sendAudio: async (params: SendAudioParams): Promise<MessageResponse> => {
    try {
      // Simulate API delay
      await delay(1500);
      
      // Simulate API response
      const recipientCount = params.recipients.split(',').length;
      
      return {
        messageId: `audio_${Date.now()}`,
        status: 'queued',
        recipients: recipientCount,
        cost: recipientCount * 0.05, // $0.05 per audio message
        success: true,
        message: 'Audio message sent successfully'
      };
    } catch (error) {
      console.error('Error sending audio message:', error);
      throw error;
    }
  },
  
  // Make voice call
  makeCall: async (params: CallParams): Promise<MessageResponse> => {
    try {
      // Simulate API delay
      await delay(1200);
      
      // Simulate API response
      const recipientCount = params.recipients.split(',').length;
      
      return {
        messageId: `call_${Date.now()}`,
        status: 'queued',
        recipients: recipientCount,
        cost: recipientCount * 0.10, // $0.10 per call
        success: true,
        message: 'Call initiated successfully'
      };
    } catch (error) {
      console.error('Error making call:', error);
      throw error;
    }
  },
  
  // Get account balance
  getBalance: async (): Promise<BalanceResponse> => {
    try {
      // Simulate API delay
      await delay(800);
      
      // Simulate API response
      return {
        balance: 150.75,
        currency: 'USD',
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw error;
    }
  },
  
  // Get message delivery status
  getMessageStatus: async (messageId: string): Promise<MessageResponse> => {
    try {
      // Simulate API delay
      await delay(500);
      
      // Extract message type from ID
      const type = messageId.split('_')[0];
      
      // Simulate different recipient counts based on type
      const recipientCountMap: Record<string, number> = {
        msg: Math.floor(Math.random() * 50) + 1,
        audio: Math.floor(Math.random() * 20) + 1,
        call: Math.floor(Math.random() * 10) + 1,
      };
      
      const recipientCount = recipientCountMap[type] || 1;
      const costMap: Record<string, number> = { msg: 0.03, audio: 0.05, call: 0.10 };
      const cost = (costMap[type] || 0.03) * recipientCount;
      
      return {
        messageId,
        status: Math.random() > 0.1 ? 'delivered' : 'failed', // 90% success rate
        recipients: recipientCount,
        cost,
        success: true,
        message: 'Status retrieved successfully'
      };
    } catch (error) {
      console.error('Error getting message status:', error);
      throw error;
    }
  },
};