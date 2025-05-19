# JayLink SMS Email System

This document provides information about the email system in JayLink SMS platform.

## Overview

The JayLink email system is designed to send transactional emails to users for various events:

- Welcome emails for new users
- Password reset instructions
- Password change confirmations
- Low balance alerts
- Message delivery reports

## Technical Implementation

The email system is built using:

- **Nodemailer**: For sending emails via SMTP
- **Handlebars**: For templating emails
- **Winston**: For logging email sending events

## Email Templates

All email templates are located in the `src/templates/emails` directory and use the `.hbs` extension (Handlebars templates). The templates use responsive HTML design with inline CSS to ensure compatibility across email clients.

### Available Templates

1. **welcome.hbs**: Sent to new users after registration
2. **password-reset.hbs**: Contains a password reset link
3. **password-changed.hbs**: Confirmation after password change
4. **low-balance.hbs**: Alert when account balance is below threshold
5. **delivery-report.hbs**: Summary of message delivery status

## Email Service

The email service is implemented in `src/services/email.service.js` and provides the following functions:

- `sendTemplateEmail`: Generic function for sending any templated email
- `sendWelcomeEmail`: Sends welcome email to new users
- `sendPasswordResetEmail`: Sends password reset instructions
- `sendPasswordChangedEmail`: Sends password change confirmation
- `sendLowBalanceEmail`: Sends low balance alerts
- `sendDeliveryReportEmail`: Sends message delivery reports

## Configuration

Email settings are configured in the `.env` file:

```
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=noreply@jaylink.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=JayLink SMS <noreply@jaylink.com>
```

## Integration with Auth System

The email system is integrated with the authentication system in the following ways:

1. User registration triggers a welcome email
2. Forgot password request sends password reset instructions
3. Password reset confirmation sends a notification email
4. Password change via settings sends a confirmation email

## Adding New Email Templates

To add a new email template:

1. Create a new `.hbs` file in the `src/templates/emails` directory
2. Add a new sending function in `src/services/email.service.js`
3. Integrate with the appropriate service in the application

## Testing Emails

In development mode, password reset tokens are logged to the console. In production, these logs are disabled for security reasons.

## Error Handling

Email sending errors are logged but do not interrupt the main application flow. This ensures that if an email fails to send, the user's action (like registration or password reset) still succeeds.

## Production Readiness

For production deployment, consider:

1. Setting up email queuing for reliability
2. Implementing retry logic for failed emails
3. Monitoring email delivery rates and bounces
4. Configuring SPF, DKIM, and DMARC records for your domain to improve deliverability
5. Testing emails with services like Litmus or Email on Acid to ensure compatibility