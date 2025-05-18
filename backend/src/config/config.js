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
    saltRounds: process.env.SALT_ROUNDS || 10,
  },

  // File Upload configuration
  upload: {
    directory: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760, // 10MB
    maxCsvSize: parseInt(process.env.MAX_CSV_SIZE, 10) || 5242880, // 5MB
    allowedAudioTypes: (process.env.ALLOWED_AUDIO_TYPES || 'audio/mpeg,audio/wav,audio/ogg').split(','),
    allowedCsvTypes: (process.env.ALLOWED_CSV_TYPES || 'text/csv,application/csv,text/plain').split(','),
  },

  // SMS Provider configuration
  smsProvider: {
    apiKey: process.env.SMS_PROVIDER_API_KEY || 'your_sms_api_key',
    baseUrl: process.env.SMS_PROVIDER_BASE_URL || 'https://api.smsprovider.com/v1',
    defaultSender: process.env.SMS_PROVIDER_DEFAULT_SENDER || 'JayLink',
  },

  // Voice Provider configuration
  voiceProvider: {
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
  },

  // Payment Gateway configuration
  paymentGateway: {
    apiKey: process.env.PAYMENT_GATEWAY_API_KEY || 'your_payment_gateway_key',
    secret: process.env.PAYMENT_GATEWAY_SECRET || 'your_payment_gateway_secret',
    url: process.env.PAYMENT_GATEWAY_URL || 'https://api.paymentgateway.com/v1',
  },

  // Security configuration
  security: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // 100 requests per window
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  },

  // Cors origins (multiple frontend URLs)
  corsOrigins: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : null,

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },
};

module.exports = config;