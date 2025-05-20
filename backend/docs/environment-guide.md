# JayLink SMS Platform Environment Variables Guide

This guide provides detailed information about configuring the JayLink SMS Platform's environment variables for secure deployment in different environments.

## Table of Contents

1. [Introduction](#introduction)
2. [Environment Files](#environment-files)
3. [Production Environment Configuration](#production-environment-configuration)
4. [Critical Security Variables](#critical-security-variables)
5. [Monitoring and Backup Configuration](#monitoring-and-backup-configuration)
6. [Troubleshooting](#troubleshooting)

## Introduction

The JayLink SMS Platform uses environment variables to configure various aspects of the application. These variables control everything from database connections to security settings and are essential for proper operation.

## Environment Files

The platform uses `.env` files to manage environment-specific configurations:

- `.env.example`: Template with documented variables (keep in version control)
- `.env.development`: Development environment settings (do not commit)
- `.env.test`: Test environment settings (can be committed)
- `.env.production`: Production environment settings (do not commit)
- `.env`: Active environment file (do not commit)

## Production Environment Configuration

When deploying to production, you need to set appropriate values for all configuration variables. Here are the most important changes needed:

### Core Settings

```properties
NODE_ENV=production
PORT=3000  # Or your preferred port
API_URL=https://api.yourproductiondomain.com
FRONTEND_URL=https://yourproductiondomain.com
```

### Database Configuration

Use a strong, unique password for the database user:

```properties
DB_HOST=your-production-db-host
DB_PORT=3306
DB_USER=jaylink_prod_user
DB_PASSWORD=strong-unique-password
DB_NAME=jaylink_production
```

### Authentication Secrets

Generate strong unique secrets for JWT tokens. You can use the following Node.js command to generate them:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

```properties
JWT_SECRET=long-random-string-for-production
JWT_REFRESH_SECRET=different-long-random-string-for-production
JWT_RESET_SECRET=another-long-random-string-for-production
SALT_ROUNDS=12  # Increase from development
```

### Security Settings

Enhance security in production:

```properties
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
CORS_ORIGIN=https://yourproductiondomain.com
CSRF_PROTECTION=true
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_TIME=30
```

### SMS Provider Configuration

Use your production SMS provider credentials:

```properties
SMS_PROVIDER=your-sms-provider
SMS_PROVIDER_API_KEY=your-production-api-key
SMS_PROVIDER_DEFAULT_SENDER=YourBrand
SMS_BACKUP_PROVIDER_ENABLED=true  # Recommended for production
```

## Critical Security Variables

The following variables contain sensitive information and require special attention:

| Variable | Description | Production Recommendation |
|----------|-------------|---------------------------|
| `DB_PASSWORD` | Database password | Use a strong, unique password (at least 16 characters) |
| `JWT_SECRET` | JWT signing key | Generate a unique 64+ character random string |
| `JWT_REFRESH_SECRET` | Refresh token key | Generate a unique 64+ character random string |
| `SMS_PROVIDER_API_KEY` | SMS provider API key | Use production credentials |
| `PAYSTACK_SECRET_KEY` | Payment processor secret | Use production credentials |
| `EMAIL_PASSWORD` | SMTP password | Use app-specific password when possible |
| `REDIS_PASSWORD` | Redis password | Use a strong password if Redis is exposed |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase credentials | Use production service account with minimal permissions |

## Monitoring and Backup Configuration

For production environments, configure robust monitoring and backup settings:

```properties
# Enable monitoring
MONITORING_ENABLED=true
MONITORING_INTERVAL=60000
MONITORING_EXTENDED_LOGGING=true
MONITORING_STORAGE_INTERVAL=900000
MONITORING_RETENTION_DAYS=90

# Configure alerts
MONITORING_ALERT_ACTIONS=log,notification,email,slack
MONITORING_EMAIL_ENABLED=true
MONITORING_EMAIL_TO=alerts@yourcompany.com
MONITORING_SLACK_ENABLED=true
MONITORING_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/PRODUCTION/WEBHOOK

# Set appropriate thresholds
THRESHOLD_SYSTEM_MEMORY_WARNING=75
THRESHOLD_SYSTEM_MEMORY_CRITICAL=85
THRESHOLD_SYSTEM_CPU_WARNING=0.7
THRESHOLD_SYSTEM_CPU_CRITICAL=0.85
THRESHOLD_DISK_USAGE_WARNING=75
THRESHOLD_DISK_USAGE_CRITICAL=85

# Configure backups
BACKUP_ENABLED=true
BACKUP_DIRECTORY=/data/backups
BACKUP_COMPRESS=true
BACKUP_RETENTION=30
BACKUP_OPTIONS=--single-transaction,--quick,--lock-tables=false

# Consider adding S3 or other remote backup
BACKUP_AWS_S3_ENABLED=true
BACKUP_AWS_S3_BUCKET=your-company-backups
BACKUP_AWS_S3_PREFIX=jaylink-production/
BACKUP_AWS_S3_RETENTION=90
```

## Environment Variable Acquisition Guide

Here's how to obtain values for key environment variables:

### Database Credentials
- Create a dedicated database user for the application with appropriate permissions.
- For production, use a separate user with more restricted permissions.

### JWT Secrets
- Generate using crypto-secure methods, not hardcoded values.
- Example using Node.js: `require('crypto').randomBytes(64).toString('hex')`

### SMS Provider API Keys
1. Sign up for an account with your preferred SMS provider
2. Navigate to the API or Developer section
3. Generate API keys for your environment
4. Use different keys for development and production

### Payment Gateway Credentials (Paystack)
1. Create an account at [Paystack](https://paystack.com/)
2. Generate API keys from the dashboard
3. Use test keys for development and live keys for production
4. Set up webhook URLs in the Paystack dashboard

### Firebase/FCM Configuration
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Add a web app to your project
3. Generate a service account key from Project Settings > Service Accounts
4. Download the JSON key file and use it for the `FIREBASE_SERVICE_ACCOUNT` variable

### SSL/TLS Certificates
- For production, use a valid SSL certificate from a trusted provider
- Consider using Let's Encrypt for free certificates
- Services like Cloudflare can provide SSL termination

### Notification Settings
- For Slack integration, create an incoming webhook in your Slack workspace
- For email notifications, use a dedicated email account or transactional email service

## Troubleshooting

If you encounter issues with environment variables:

1. Check that all required variables are set correctly
2. Verify that file permissions allow the application to read the `.env` file
3. Restart the application after changing environment variables
4. Check logs for any environment-related errors
5. For Redis or database connection issues, verify connectivity from your server

Remember to never commit sensitive information to version control systems. Use environment variables or secure secrets management tools for sensitive data.