# Complete Firebase & Push Notifications Setup Guide

## 1. Firebase Console Setup

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "jaylink-notifications")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Get Firebase Configuration
1. In your Firebase project dashboard, click the gear icon ⚙️ → "Project settings"
2. Scroll down to "Your apps" section
3. Click "Add app" and choose Web (</>) icon
4. Register your app with a nickname (e.g., "JayLink Web App")
5. Copy the Firebase config object - you'll need these values:

```javascript
// Your Firebase config will look like this:
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id", 
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### Step 3: Get FCM Server Key
1. In Firebase Console, go to "Project settings"
2. Click on "Cloud Messaging" tab
3. Under "Project credentials", you'll find:
   - **Server key** (this is your FCM_SERVER_KEY)
   - **Sender ID** (this is your messagingSenderId)

### Step 4: Generate Service Account Key
1. In Firebase Console, go to "Project settings"
2. Click "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file
5. This JSON content becomes your `FIREBASE_SERVICE_ACCOUNT`

## 2. Web Push Keys Setup

### Generate VAPID Keys for Web Push
You need to generate VAPID (Voluntary Application Server Identification) keys for web push notifications.

#### Method 1: Using web-push library
```bash
npm install -g web-push
web-push generate-vapid-keys
```

#### Method 2: Online Generator
Visit: https://vapidkeys.com/

#### Method 3: Using Node.js Script
Create a temporary script:

```javascript
const webpush = require('web-push');
const vapidKeys = webpush.generateVAPIDKeys();

console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
```

## 3. Complete Environment Variables

Based on your config, here are all the environment variables you need:

```env
# Notification Features
PUSH_NOTIFICATIONS_ENABLED=true
EMAIL_NOTIFICATIONS_ENABLED=true
WEBSOCKET_NOTIFICATIONS_ENABLED=true
NOTIFICATION_RETENTION_DAYS=30

# FCM Configuration
FCM_SERVER_KEY=your_actual_server_key_from_firebase_console

# Web Push VAPID Keys
WEB_PUSH_PUBLIC_KEY=your_generated_vapid_public_key
WEB_PUSH_PRIVATE_KEY=your_generated_vapid_private_key

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_SECRET=your-client-secret
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# Firebase Service Account (JSON string)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-...@your-project.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-...%40your-project.iam.gserviceaccount.com"}
```

## 4. Step-by-Step Value Extraction

### From Firebase Console:

1. **FIREBASE_PROJECT_ID**: 
   - Go to Project Settings → General tab
   - Copy "Project ID"

2. **FCM_SERVER_KEY**:
   - Go to Project Settings → Cloud Messaging tab
   - Copy "Server key"

3. **FIREBASE_DATABASE_URL**:
   - If using Realtime Database: Go to Realtime Database → Copy the URL
   - Format: `https://your-project-default-rtdb.firebaseio.com/`

4. **FIREBASE_SERVICE_ACCOUNT**:
   - Go to Project Settings → Service Accounts tab
   - Click "Generate new private key"
   - Download JSON file
   - Copy entire JSON content as string

### From VAPID Generation:

5. **WEB_PUSH_PUBLIC_KEY**: Your generated VAPID public key
6. **WEB_PUSH_PRIVATE_KEY**: Your generated VAPID private key

## 5. Additional Setup Requirements

### Client-Side Setup (Frontend)
You'll need to add the Firebase SDK to your frontend:

```html
<!-- Add to your HTML -->
<script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging.js"></script>
```

### Service Worker for Web Push
Create `firebase-messaging-sw.js` in your public folder:

```javascript
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
});

const messaging = firebase.messaging();
```

## 6. Testing Your Setup

### Test Environment Variables:
Create a test script to verify your configuration:

```javascript
const config = require('./src/config/config');

console.log('Notification Config:');
console.log('Push Enabled:', config.notifications.pushEnabled);
console.log('FCM Server Key:', config.notifications.fcmServerKey ? 'Set' : 'Missing');
console.log('Web Push Keys:', {
  public: config.notifications.webPushPublicKey ? 'Set' : 'Missing',
  private: config.notifications.webPushPrivateKey ? 'Set' : 'Missing'
});
console.log('Firebase Project ID:', config.firebase.projectId || 'Missing');
```

## 7. Common Issues & Solutions

### Issue 1: "FCM Server Key not found"
- **Solution**: Ensure you're copying the "Server key" from Cloud Messaging tab, not the Web API key

### Issue 2: Service Account JSON parsing errors
- **Solution**: Ensure the JSON is properly escaped when setting as environment variable
- **Alternative**: Store as base64 encoded string and decode in your app

### Issue 3: VAPID keys not working
- **Solution**: Make sure public key is also configured in your frontend Firebase config

### Issue 4: Cross-origin issues
- **Solution**: Add your domain to Firebase authorized domains in Authentication → Settings

## 8. Security Best Practices

1. **Never expose server keys in client-side code**
2. **Use environment variables for all sensitive data**
3. **Restrict FCM server key to your server IP if possible**
4. **Regularly rotate service account keys**
5. **Use Firebase App Check for additional security**

## 9. Production Deployment Checklist

- [ ] All environment variables set in production environment
- [ ] Service account JSON properly configured
- [ ] Firebase project has billing enabled (for production usage)
- [ ] Web push service worker deployed and accessible
- [ ] CORS settings configured for your domain
- [ ] Firebase security rules updated if using Realtime Database
- [ ] Test notifications working end-to-end

## 10. Monitoring & Analytics

Set up monitoring for your notification system:

1. **Firebase Analytics**: Track notification open rates
2. **Error Logging**: Monitor failed notification deliveries  
3. **Performance**: Track notification delivery times
4. **User Engagement**: Monitor notification preferences and opt-out rates

This setup will give you a complete notification system with Firebase push notifications, web push, email notifications, and WebSocket real-time updates.