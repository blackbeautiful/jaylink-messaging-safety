// backend/src/utils/firebase.util.js
const admin = require('firebase-admin');
const config = require('../config/config');
const logger = require('../config/logger');

/**
 * Firebase utility for push notifications
 */
class FirebaseUtil {
  constructor() {
    this.initialized = false;
  }
  
  /**
   * Initialize Firebase with credentials
   */
  initialize() {
    try {
      // Skip initialization if already initialized
      if (this.initialized) {
        return true;
      }
      
      // Skip Firebase initialization if push notifications are disabled
      if (!config.notifications.pushEnabled) {
        logger.info('Push notifications are disabled, skipping Firebase initialization');
        return false;
      }
      
      // Check if Firebase configuration is available
      if (!config.notifications.fcmServerKey && !config.firebase?.serviceAccount) {
        logger.warn('Firebase configuration not found, push notifications will not be available');
        return false;
      }
      
      // Initialize Firebase Admin SDK
      if (config.firebase?.serviceAccount) {
        // Initialize with service account credentials
        let serviceAccount;
        
        // If service account is a string, try to parse as JSON
        if (typeof config.firebase.serviceAccount === 'string') {
          try {
            serviceAccount = JSON.parse(config.firebase.serviceAccount);
          } catch (error) {
            // If parsing fails, assume it's a path to the JSON file
            try {
              const fs = require('fs');
              const serviceAccountPath = config.firebase.serviceAccount;
              if (fs.existsSync(serviceAccountPath)) {
                serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
              } else {
                logger.error(`Firebase service account file not found at: ${serviceAccountPath}`);
                // Use FCM server key fallback if available
                if (config.notifications.fcmServerKey) {
                  logger.info('Using FCM server key as fallback for Firebase initialization');
                  return this._initializeWithFcmKey();
                }
                return false;
              }
            } catch (fileError) {
              logger.error(`Failed to read Firebase service account file: ${fileError.message}`);
              return false;
            }
          }
        } else {
          // It's already an object
          serviceAccount = config.firebase.serviceAccount;
        }
        
        // Validate service account has required fields
        if (!serviceAccount || !serviceAccount.project_id || !serviceAccount.private_key) {
          logger.error('Invalid Firebase service account configuration');
          // Try FCM key fallback
          if (config.notifications.fcmServerKey) {
            logger.info('Using FCM server key as fallback for Firebase initialization');
            return this._initializeWithFcmKey();
          }
          return false;
        }
        
        try {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: config.firebase.databaseURL
          });
          
          this.initialized = true;
          logger.info('Firebase initialized successfully with service account');
          return true;
        } catch (initError) {
          logger.error(`Firebase initialization error with service account: ${initError.message}`);
          // Try FCM key fallback
          if (config.notifications.fcmServerKey) {
            logger.info('Using FCM server key as fallback for Firebase initialization');
            return this._initializeWithFcmKey();
          }
          return false;
        }
      } else if (config.notifications.fcmServerKey) {
        // Initialize with FCM server key for legacy compatibility
        return this._initializeWithFcmKey();
      } else {
        // In development, use a mock implementation if no credentials are available
        if (config.env === 'development') {
          logger.info('Development mode: Using mock Firebase implementation');
          this.initialized = true;
          this.mockMode = true;
          return true;
        }
        
        logger.error('No Firebase credentials available');
        return false;
      }
    } catch (error) {
      logger.error(`Firebase initialization error: ${error.message}`, { stack: error.stack });
      return false;
    }
  }
  
  /**
   * Initialize Firebase with FCM server key
   * @private
   */
  _initializeWithFcmKey() {
    try {
      // For development mode, just set mock mode if FCM key doesn't look valid
      if (config.env === 'development' && 
         (!config.notifications.fcmServerKey || 
          config.notifications.fcmServerKey === 'your_fcm_server_key')) {
        logger.info('Development mode: Using mock Firebase implementation');
        this.initialized = true;
        this.mockMode = true;
        return true;
      }
      
      // Attempt to initialize with FCM key
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
      
      this.initialized = true;
      logger.info('Firebase initialized successfully with FCM server key');
      return true;
    } catch (error) {
      logger.error(`Firebase initialization with FCM key failed: ${error.message}`);
      
      // In development, use mock implementation as fallback
      if (config.env === 'development') {
        logger.info('Development mode: Using mock Firebase implementation');
        this.initialized = true;
        this.mockMode = true;
        return true;
      }
      
      return false;
    }
  }
  
  /**
   * Check if Firebase is initialized
   * @returns {boolean} True if initialized
   */
  isInitialized() {
    return this.initialized;
  }
  
  /**
   * Get Firebase messaging service
   * @returns {Object} Firebase messaging
   */
  messaging() {
    if (!this.initialized) {
      this.initialize();
    }
    
    if (!this.initialized) {
      throw new Error('Firebase is not initialized');
    }
    
    // Return mock implementation in mock mode
    if (this.mockMode) {
      return this._getMockMessaging();
    }
    
    return admin.messaging();
  }
  
  /**
   * Get mock messaging implementation for development
   * @private
   */
  _getMockMessaging() {
    return {
      send: (payload) => {
        logger.debug('MOCK Firebase: send message', { payload });
        return Promise.resolve({ messageId: `mock-msg-${Date.now()}` });
      },
      
      sendMulticast: (payload) => {
        const tokens = payload.tokens || [];
        logger.debug(`MOCK Firebase: send multicast to ${tokens.length} devices`, { 
          tokenCount: tokens.length,
          notification: payload.notification
        });
        
        return Promise.resolve({
          successCount: tokens.length,
          failureCount: 0,
          responses: tokens.map(() => ({ success: true }))
        });
      },
      
      sendToTopic: (topic, payload) => {
        logger.debug(`MOCK Firebase: send to topic '${topic}'`, { payload });
        return Promise.resolve({ messageId: `mock-topic-${topic}-${Date.now()}` });
      }
    };
  }
  
  /**
   * Send message to a specific device
   * @param {string} token - FCM device token
   * @param {Object} payload - Notification payload
   * @returns {Promise<Object>} Send result
   */
  async sendToDevice(token, payload) {
    if (!this.initialized) {
      this.initialize();
    }
    
    if (!this.initialized) {
      throw new Error('Firebase is not initialized');
    }
    
    // Use mock implementation in mock mode
    if (this.mockMode) {
      return this._getMockMessaging().send({
        token,
        ...payload
      });
    }
    
    return admin.messaging().send({
      token,
      ...payload
    });
  }
  
  /**
   * Send message to multiple devices
   * @param {Array<string>} tokens - FCM device tokens
   * @param {Object} payload - Notification payload
   * @returns {Promise<Object>} Send result
   */
  async sendMulticast(tokens, payload) {
    if (!this.initialized) {
      this.initialize();
    }
    
    if (!this.initialized) {
      throw new Error('Firebase is not initialized');
    }
    
    // Use mock implementation in mock mode
    if (this.mockMode) {
      return this._getMockMessaging().sendMulticast({
        tokens,
        ...payload
      });
    }
    
    return admin.messaging().sendMulticast({
      tokens,
      ...payload
    });
  }
  
  /**
   * Send message to a topic
   * @param {string} topic - Topic name
   * @param {Object} payload - Notification payload
   * @returns {Promise<Object>} Send result
   */
  async sendToTopic(topic, payload) {
    if (!this.initialized) {
      this.initialize();
    }
    
    if (!this.initialized) {
      throw new Error('Firebase is not initialized');
    }
    
    // Use mock implementation in mock mode
    if (this.mockMode) {
      return this._getMockMessaging().sendToTopic(topic, payload);
    }
    
    return admin.messaging().sendToTopic(topic, payload);
  }
}

// Export as singleton
module.exports = new FirebaseUtil();