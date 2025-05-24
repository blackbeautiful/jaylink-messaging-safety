# SMS Provider Integration Setup Guide

## 🚀 Quick Setup

### 1. Update Environment Variables

Copy the `.env.template` and update with your actual credentials:

```bash
# SMS Provider Configuration - SMSProvider.com.ng (Primary)
SMS_PROVIDER=smsprovider.com.ng
SMS_PROVIDER_USERNAME=your_actual_username
SMS_PROVIDER_PASSWORD=your_actual_password
SMS_PROVIDER_BASE_URL=https://customer.smsprovider.com.ng
SMS_PROVIDER_DEFAULT_SENDER=YourBrand

# Backup SMS Provider - Termii (Optional but recommended)
SMS_BACKUP_PROVIDER_ENABLED=true
TERMII_API_KEY=your_termii_api_key_here

# Development Mode (set to 'true' to test with real providers)
FORCE_REAL_SMS=false
```

### 2. Test Your Configuration

Run the integration test to verify everything works:

```bash
cd backend
node test/sms-integration.test.js
```

## 📋 Key Changes Made

### ✅ Fixed API Integration Issues:

1. **Authentication Method**: Changed from API key to username/password (as required by SMSProvider.com.ng)
2. **Request Format**: Using GET requests with query parameters instead of POST with JSON
3. **Phone Number Formatting**: Correctly formatting for Nigerian numbers (234xxxxxxxxx format)
4. **Response Parsing**: Properly handling SMSProvider.com.ng response format
5. **Error Handling**: Added comprehensive error codes and messages

### ✅ Enhanced Features:

1. **Backup Provider**: Integrated Termii as backup when primary fails
2. **Cost Calculation**: Accurate pricing based on message segments and special characters
3. **Development Mode**: Simulated SMS sending for testing without actual charges
4. **Retry Logic**: Exponential backoff for failed requests
5. **Comprehensive Logging**: Detailed logs for debugging and monitoring

## 🔧 SMSProvider.com.ng Integration Details

### API Endpoint Format:
```
https://customer.smsprovider.com.ng/api/?username=USER&password=PASS&message=TEXT&sender=SENDER&mobiles=NUMBERS
```

### Response Formats:
- **Success**: `{"status":"OK","count":1,"price":2}`
- **Error**: `{"error":"Login denied.","errno":"103"}`

### Error Codes Handled:
- `100`: Incomplete request parameters
- `110-111`: Login/authentication issues
- `120-122`: Limit exceeded errors
- `130-131`: Content restrictions
- `150-152`: Service/gateway issues
- `190-191`: System errors

## 🔄 Termii Backup Integration

### API Endpoints:
- Single SMS: `POST /api/sms/send`
- Bulk SMS: `POST /api/sms/send/bulk`

### Request Format:
```json
{
  "to": "2347880234567",
  "from": "sender",
  "sms": "message content",
  "type": "plain",
  "channel": "generic",
  "api_key": "your_api_key"
}
```

## 🧪 Testing Guide

### 1. Configuration Test
```bash
# Test if all required environment variables are set
node test/sms-integration.test.js
```

### 2. Development Testing (Simulated)
```bash
# Set FORCE_REAL_SMS=false in .env
# This will simulate SMS sending without actual charges
npm run test:sms
```

### 3. Production Testing (Real SMS)
```bash
# Set FORCE_REAL_SMS=true in .env
# This will send real SMS (charges apply)
# Use test numbers only!
FORCE_REAL_SMS=true node test/sms-integration.test.js
```

### 4. Manual Testing
```javascript
const { testManualSMS } = require('./test/sms-integration.test.js');

// Send a test SMS
testManualSMS('2348012345678', 'Test message from JayLink');
```

## 📊 Cost Calculation

### Message Segments:
- **Standard SMS**: 160 characters per segment
- **SMS with special characters**: 70 characters per segment
- **Special characters**: `;`, `/`, `^`, `{`, `}`, `\`, `[`, `~`, `]`, `|`, `€`, `'`, `"`, ` ``` `

### Pricing (configurable in .env):
- **Local SMS**: 5.00 NGN per segment (default)
- **International SMS**: 15.00 NGN per segment (default)

### Example Calculations:
```javascript
// 150 character message = 1 segment = ₦5.00
// 200 character message = 2 segments = ₦10.00
// 150 chars with special chars = 3 segments = ₦15.00
```

## 🔒 Security Best Practices

### Environment Variables:
- Never commit real credentials to version control
- Use different credentials for development/production
- Regularly rotate API keys and passwords
- Store sensitive data in secure environment management systems

### Rate Limiting:
- Built-in rate limiting prevents abuse
- Exponential backoff for failed requests
- Circuit breaker pattern for provider failures

## 🚨 Troubleshooting

### Common Issues:

1. **"Login denied" Error**:
   - Check SMS_PROVIDER_USERNAME and SMS_PROVIDER_PASSWORD
   - Verify credentials with SMSProvider.com.ng support

2. **"Insufficient funds" Error**:
   - Check your SMSProvider.com.ng account balance
   - Top up your account or contact billing

3. **Connection Timeout**:
   - Check internet connectivity
   - Verify SMS_PROVIDER_BASE_URL is correct
   - Try backup provider if available

4. **Invalid Phone Numbers**:
   - Ensure Nigerian numbers are in format: 234xxxxxxxxx
   - International numbers should start with country code

### Debug Mode:
```bash
# Enable detailed logging
LOG_LEVEL=debug node your-app.js

# Test specific scenarios
FORCE_REAL_SMS=true node test/sms-integration.test.js
```

## 📞 Support

### SMSProvider.com.ng:
- Website: https://smsprovider.com.ng
- Support: Contact their support team for account issues
- Documentation: API documentation provided above

### Termii (Backup):
- Website: https://termii.com
- Documentation: https://developers.termii.com
- Support: Check their support channels

### JayLink Platform:
- Check logs in `logs/` directory
- Run integration tests for diagnosis
- Review configuration against this guide

## 🎯 Next Steps

1. **Set up your credentials** in the `.env` file
2. **Run the integration test** to verify setup
3. **Test in development mode** first (FORCE_REAL_SMS=false)
4. **Gradually test with real SMS** using test numbers
5. **Monitor logs** for any issues
6. **Set up backup provider** for redundancy
7. **Configure monitoring** for production use

---

This setup ensures reliable, scalable SMS delivery with proper error handling, cost calculation, and fallback mechanisms.