# JayLink SMS Platform - Backend

A full-featured, production-ready SMS messaging platform backend with user management, SMS sending, contacts, groups, and payment integration.

## Enhanced Features

### Currency and Payment Processing
- **Naira-based Transactions**: All financial transactions now use Nigerian Naira (₦) instead of USD
- **Paystack Integration**: Full integration with Paystack payment gateway for Nigerian payments
- **Payment Webhooks**: Automatic balance updates through Paystack webhooks
- **Multiple Payment Channels**: Support for cards, bank transfers, USSD, and other Paystack payment channels

### SMS Functionality
- **Nigerian SMS Providers**: Integration with Nigerian SMS providers (smsprovider.com.ng and others)
- **Development Mode**: Simulated SMS sending in development to avoid actual charges
- **Backup Providers**: Fallback to backup SMS providers if the primary provider fails
- **Rate Optimization**: Intelligent handling of Nigerian phone number formats
- **Delivery Status Tracking**: Enhanced message delivery status tracking

### Notifications System
- **In-app Notifications**: Comprehensive notification system for important events
- **Multiple Notification Types**: Support for info, success, warning, and error notifications
- **Notification Settings**: User-configurable notification preferences
- **Read/Unread Status**: Tracking of notification read status

### Configuration and Security
- **Environment-based Configuration**: Enhanced configuration system with sensible defaults
- **Webhook Security**: Proper signature verification for payment webhooks
- **Rate Limiting**: Configurable rate limiting for API endpoints
- **Error Handling**: Improved error handling and logging
- **CORS Configuration**: Flexible CORS settings for frontend integration

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Environment
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:8080

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=jaylink_user
DB_PASSWORD=your_password
DB_NAME=jaylink_db

# JWT Auth
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Currency
CURRENCY_CODE=NGN
CURRENCY_SYMBOL=₦
CURRENCY_NAME=Naira

# SMS Provider
SMS_PROVIDER=smsprovider.com.ng
SMS_PROVIDER_API_KEY=your_sms_api_key
SMS_PROVIDER_BASE_URL=https://api.smsprovider.com.ng/api/v1
SMS_PROVIDER_DEFAULT_SENDER=JayLink
SMS_PRICING_LOCAL=300
SMS_PRICING_INTERNATIONAL=1000
SMS_PROVIDER_USERNAME=your_sms_username
SMS_PROVIDER_ACCOUNT_ID=your_account_id

# Payment Gateway (Paystack)
PAYMENT_PROVIDER=paystack
PAYSTACK_PUBLIC_KEY=your_paystack_public_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_WEBHOOK_SECRET=your_paystack_webhook_secret
PAYSTACK_CALLBACK_URL=https://yoursite.com/api/payments/verify
PAYSTACK_CHANNELS=card,bank_transfer,ussd

# Email
EMAIL_HOST=smtp.yourprovider.com
EMAIL_PORT=587
EMAIL_USER=noreply@yourapp.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=JayLink <noreply@yourapp.com>

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
CORS_ORIGIN=http://localhost:8080

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/app.log

# System Defaults
DEFAULT_MIN_BALANCE=500
```

## Database Migration

Run the following commands to set up the database:

```bash
# Install sequelize CLI if not already installed
npm install -g sequelize-cli

# Create database
sequelize db:create

# Run migrations
sequelize db:migrate

# Seed initial data
sequelize db:seed:all
```

## Running the Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh-token` - Refresh authentication token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### User Management
- `GET /api/users/profile` - Get user profile
- `PATCH /api/users/profile` - Update user profile
- `GET /api/users/settings` - Get user settings
- `PATCH /api/users/settings` - Update user settings
- `POST /api/users/change-password` - Change password

### Contacts
- `GET /api/contacts` - Get all contacts
- `POST /api/contacts` - Create a new contact
- `GET /api/contacts/:id` - Get a single contact
- `PATCH /api/contacts/:id` - Update a contact
- `DELETE /api/contacts/:id` - Delete a contact
- `POST /api/contacts/import` - Import contacts from CSV

### Groups
- `GET /api/groups` - Get all groups
- `POST /api/groups` - Create a new group
- `GET /api/groups/:id` - Get a single group
- `PATCH /api/groups/:id` - Update a group
- `DELETE /api/groups/:id` - Delete a group
- `GET /api/groups/:id/contacts` - Get contacts in a group
- `POST /api/groups/:id/contacts` - Add contacts to a group
- `DELETE /api/groups/:id/contacts/:contactId` - Remove contact from group

### SMS
- `POST /api/sms/send` - Send SMS message
- `POST /api/sms/bulk` - Send bulk SMS messages
- `GET /api/sms/status/:messageId` - Get message status
- `GET /api/sms/history` - Get message history
- `GET /api/sms/scheduled` - Get scheduled messages
- `DELETE /api/sms/scheduled/:id` - Cancel scheduled message
- `GET /api/sms/analytics` - Get message analytics

### Balance
- `GET /api/balance` - Get user balance
- `GET /api/balance/transactions` - Get transaction history
- `GET /api/balance/summary` - Get balance summary
- `POST /api/balance/topup` - Top up account balance manually

### Payments
- `POST /api/payments/initialize` - Initialize a payment
- `POST /api/payments/details` - Get payment details for frontend
- `GET /api/payments/verify/:reference` - Verify a payment
- `POST /api/payments/webhook` - Payment webhook handler
- `GET /api/payments/methods` - Get available payment methods
- `GET /api/payments/banks` - Get list of supported banks

### Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/stats` - Get notification statistics
- `POST /api/notifications/read` - Mark notifications as read
- `PATCH /api/notifications/:id/read` - Mark a notification as read
- `DELETE /api/notifications` - Delete multiple notifications
- `DELETE /api/notifications/:id` - Delete a notification

## Webhooks

### Paystack Webhook

Set up a webhook in your Paystack dashboard pointing to:
```
https://yourapp.com/api/payments/webhook
```

Make sure to configure the webhook secret in your `.env` file.

## SMS Provider Integration

The system is configured to work with Nigerian SMS providers. To integrate with different providers:

1. Update the `smsProviderService._sendWithProvider` method to support your provider
2. Add your provider's specific implementation in a new method following the pattern of existing methods
3. Configure your provider's API key and URL in the `.env` file

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request