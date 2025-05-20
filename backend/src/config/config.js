// backend/src/config/config.js
require('dotenv').config();

/**
 * Application configuration
 */
const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080',

  // Currency Configuration
  currency: {
    code: process.env.CURRENCY_CODE || 'NGN',
    symbol: process.env.CURRENCY_SYMBOL || '₦',
    name: process.env.CURRENCY_NAME || 'Naira',
    decimalPlaces: parseInt(process.env.CURRENCY_DECIMAL_PLACES, 10) || 2,
  },

  // Database configuration
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'jaylink_user',
    password: process.env.DB_PASSWORD || 'jaylinkdev123',
    name: process.env.DB_NAME || 'jaylink_db',
    // Handle Railway's database URL format if provided
    url: process.env.DATABASE_URL || null,
  },

  // JWT Authentication configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    jwtResetSecret: process.env.JWT_RESET_SECRET || 'your_jwt_reset_secret',
    saltRounds: parseInt(process.env.SALT_ROUNDS, 10) || 10,
  },

  // File Upload configuration
  upload: {
    directory: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760, // 10MB
    maxCsvSize: parseInt(process.env.MAX_CSV_SIZE, 10) || 5242880, // 5MB
    allowedAudioTypes: (process.env.ALLOWED_AUDIO_TYPES || 'audio/mpeg,audio/wav,audio/ogg').split(
      ','
    ),
    allowedCsvTypes: (process.env.ALLOWED_CSV_TYPES || 'text/csv,application/csv,text/plain').split(
      ','
    ),
  },

  // SMS Provider configuration
  smsProvider: {
    provider: process.env.SMS_PROVIDER || 'smsprovider.com.ng',
    apiKey: process.env.SMS_PROVIDER_API_KEY || 'your_sms_api_key',
    baseUrl: process.env.SMS_PROVIDER_BASE_URL || 'https://api.smsprovider.com.ng/api/v1',
    defaultSender: process.env.SMS_PROVIDER_DEFAULT_SENDER || 'JayLink',
    // Pricing configuration (in kobo per segment)
    pricing: {
      localSms: parseInt(process.env.SMS_PRICING_LOCAL, 10) || 300, // 3 naira per local SMS
      internationalSms: parseInt(process.env.SMS_PRICING_INTERNATIONAL, 10) || 1000, // 10 naira per international SMS
    },
    // Provider-specific configuration
    options: {
      username: process.env.SMS_PROVIDER_USERNAME,
      accountId: process.env.SMS_PROVIDER_ACCOUNT_ID,
    },
    // Backup provider if configured
    backup: {
      enabled: process.env.SMS_BACKUP_PROVIDER_ENABLED === 'true',
      provider: process.env.SMS_BACKUP_PROVIDER,
      apiKey: process.env.SMS_BACKUP_PROVIDER_API_KEY,
      baseUrl: process.env.SMS_BACKUP_PROVIDER_BASE_URL,
    },
  },

  // Voice Provider configuration
  voiceProvider: {
    provider: process.env.VOICE_PROVIDER || 'default',
    apiKey: process.env.VOICE_PROVIDER_API_KEY || 'your_voice_api_key',
    baseUrl: process.env.VOICE_PROVIDER_BASE_URL || 'https://api.voiceprovider.com/v1',
    accountSid: process.env.VOICE_PROVIDER_ACCOUNT_SID || 'your_account_sid',
    authToken: process.env.VOICE_PROVIDER_AUTH_TOKEN || 'your_auth_token',
  },

  // Email configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    user: process.env.EMAIL_USER || 'noreply@jaylink.com',
    password: process.env.EMAIL_PASSWORD || 'your_email_password',
    from: process.env.EMAIL_FROM || 'JayLink <noreply@jaylink.com>',
    adminEmail: process.env.ADMIN_EMAIL || 'admin@jaylink.com',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@jaylink.com',
  },

  // Payment Gateway configuration (Paystack)
  paymentGateway: {
    provider: process.env.PAYMENT_PROVIDER || 'paystack',
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || 'your_paystack_public_key',
    secretKey: process.env.PAYSTACK_SECRET_KEY || 'your_paystack_secret_key',
    baseUrl: process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co',
    callbackUrl: process.env.PAYSTACK_CALLBACK_URL || 'https://jaylink.com/api/payments/verify',
    webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET || 'your_paystack_webhook_secret',
    testMode: process.env.PAYMENT_TEST_MODE === 'true' || process.env.NODE_ENV !== 'production',
    // Channels to accept payment through
    channels: (process.env.PAYSTACK_CHANNELS || 'card,bank_transfer,ussd').split(','),
  },

  // Notification configuration
  notifications: {
    pushEnabled: process.env.PUSH_NOTIFICATIONS_ENABLED === 'true' || false,
    fcmServerKey: process.env.FCM_SERVER_KEY,
    webPushPublicKey: process.env.WEB_PUSH_PUBLIC_KEY,
    webPushPrivateKey: process.env.WEB_PUSH_PRIVATE_KEY,
    retentionDays: parseInt(process.env.NOTIFICATION_RETENTION_DAYS, 10) || 30,
  },

  // Firebase configuration for push notifications
  firebase: {
    serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientId: process.env.FIREBASE_CLIENT_ID,
    clientSecret: process.env.FIREBASE_CLIENT_SECRET,
  },
  
  // Redis configuration for queue system
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === 'true',
    // Add these new retry and reconnect settings
    maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES_PER_REQUEST, 10) || 3,
    reconnectOnError: function (err) {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        // Only reconnect on specific errors
        return true;
      }
    },
    retryStrategy: function (times) {
      if (times > 10) {
        logger.error('Redis connection failed too many times. Giving up.');
        return null; // Ends reconnecting after 10 attempts
      }
      return Math.min(times * 100, 3000); // Time between retries with exponential backoff
    },
    // Development fallback - enable mock mode if Redis is not available
    enableMockInDev: process.env.REDIS_ENABLE_MOCK_IN_DEV === 'true' || true,
  },

  // System settings defaults
  systemDefaults: {
    minimumBalanceThreshold: parseFloat(process.env.DEFAULT_MIN_BALANCE) || 500, // 500 Naira
    lowBalancePercentage: parseInt(process.env.LOW_BALANCE_PERCENTAGE, 10) || 15, // 15%
    defaultTimeZone: process.env.DEFAULT_TIMEZONE || 'Africa/Lagos',
    contactsPerPage: parseInt(process.env.CONTACTS_PER_PAGE, 10) || 20,
    transactionsPerPage: parseInt(process.env.TRANSACTIONS_PER_PAGE, 10) || 20,
    messagesPerPage: parseInt(process.env.MESSAGES_PER_PAGE, 10) || 20,
  },

  // Security configuration
  security: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // 100 requests per window
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:8080',
    csrfProtection: process.env.CSRF_PROTECTION === 'true' || process.env.NODE_ENV === 'production',
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 5,
    lockoutTime: parseInt(process.env.ACCOUNT_LOCKOUT_TIME, 10) || 30, // 30 minutes
  },

  // CORS origins (multiple frontend URLs)
  corsOrigins: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:8080'],

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    file: process.env.LOG_FILE || 'logs/app.log',
    enableConsole: process.env.LOG_CONSOLE !== 'false',
    logRequests: process.env.LOG_REQUESTS !== 'false',
    errorLogFile: process.env.ERROR_LOG_FILE || 'logs/error.log',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: process.env.LOG_MAX_FILES || 7,
  },
};

// Validate critical configuration for production environment
if (config.env === 'production') {
  const requiredEnvVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'SMS_PROVIDER_API_KEY',
    'PAYSTACK_SECRET_KEY',
    'PAYSTACK_WEBHOOK_SECRET',
  ];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
  if (missingVars.length > 0) {
    console.warn(`Missing critical environment variables in production: ${missingVars.join(', ')}`);
    console.warn('Please set these variables for security and proper functioning.');
  }
}

module.exports = config;
