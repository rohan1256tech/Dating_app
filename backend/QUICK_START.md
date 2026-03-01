# Dating App Backend - Quick Start Guide

## 🚀 Prerequisites

Before running the backend, ensure you have:

1. **Node.js 20+** installed
2. **Redis server** running (required for OTP storage)

## 📦 Installation

```bash
cd backend
npm install
```

## ⚡ Quick Start

### Option 1: Using Docker (Recommended)

```bash
# Start Redis + Backend together
docker-compose up
```

### Option 2: Manual Setup

**Step 1: Start Redis**
```bash
# Using Docker
docker run -d -p 6379:6379 redis:7-alpine

# OR install locally and run
redis-server
```

**Step 2: Start Backend**
```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## 🧪 Testing the API

### Using cURL

**1. Request OTP**
```bash
curl -X POST http://localhost:3000/auth/request-otp \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\": \"+919876543210\"}"
```

**Check your console** for the OTP (it will be logged since we're using mock SMS):
```
📱 SMS to +919876543210: Your OTP is 456789. Valid for 5 minutes.
```

**2. Verify OTP**
```bash
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\": \"+919876543210\", \"otp\": \"456789\"}"
```

You'll receive JWT tokens:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "65f...",
    "phoneNumber": "+919876543210",
    "isVerified": true
  }
}
```

### Using Postman or Thunder Client

1. **Request OTP**
   - Method: `POST`
   - URL: `http://localhost:3000/auth/request-otp`
   - Body (JSON):
     ```json
     {
       "phoneNumber": "+919876543210"
     }
     ```

2. **Verify OTP**
   - Method: `POST`
   - URL: `http://localhost:3000/auth/verify-otp`
   - Body (JSON):
     ```json
     {
       "phoneNumber": "+919876543210",
       "otp": "123456"
     }
     ```

3. **Refresh Token**
   - Method: `POST`
   - URL: `http://localhost:3000/auth/refresh`
   - Body (JSON):
     ```json
     {
       "refreshToken": "your-refresh-token-here"
     }
     ```

## 📱 Mobile App Integration

### React Native Example

```typescript
// 1. Request OTP
const requestOTP = async (phoneNumber: string) => {
  try {
    const response = await fetch('http://localhost:3000/auth/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber }),
    });
    
    const data = await response.json();
    console.log(data.message); // "OTP sent successfully"
  } catch (error) {
    console.error('Error requesting OTP:', error);
  }
};

// 2. Verify OTP & Store Tokens
const verifyOTP = async (phoneNumber: string, otp: string) => {
  try {
    const response = await fetch('http://localhost:3000/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, otp }),
    });
    
    const { accessToken, refreshToken, user } = await response.json();
    
    // Store tokens securely
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    
    return user;
  } catch (error) {
    console.error('Error verifying OTP:', error);
  }
};

// 3. Make Authenticated Requests
const makeAuthenticatedRequest = async (endpoint: string) => {
  const accessToken = await AsyncStorage.getItem('accessToken');
  
  const response = await fetch(`http://localhost:3000${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  
  return response.json();
};

// 4. Refresh Token When Expired
const refreshAccessToken = async () => {
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  
  const response = await fetch('http://localhost:3000/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  
  const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await response.json();
  
  await AsyncStorage.setItem('accessToken', newAccessToken);
  await AsyncStorage.setItem('refreshToken', newRefreshToken);
};
```

## 🔧 Configuration

All settings are in `.env` file:

```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB Atlas (already configured)
MONGODB_URI=mongodb+srv://...

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (change these in production!)
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# OTP
OTP_LENGTH=6
OTP_EXPIRY=300
OTP_MAX_ATTEMPTS=3
```

## ✅ Verification Checklist

After starting the server, you should see:

```
✅ MongoDB Atlas connected successfully
✅ Redis Client Connected

╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 Dating App Backend Server Running               ║
║                                                       ║
║   📡 Port: 3000                                       ║
║   🌍 Environment: development                         ║
║   📱 Mobile App Ready                                 ║
║   🔐 OTP Authentication Active                        ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

**Test the endpoints:**
- ✅ Request OTP → Check console for 6-digit code
- ✅ Verify OTP → Receive JWT tokens
- ✅ Refresh token → Get new access token

## 🚨 Common Issues

### "Redis connection refused"
**Solution**: Start Redis server first
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

### "MongoDB connection error"
**Solution**: Check `.env` file has correct `MONGODB_URI`

### OTP not received
**Solution**: Check console logs - OTP is printed there (mock SMS)

## 📚 Next Steps

1. ✅ **Test OTP flow** with different phone numbers
2. ✅ **Integrate with React Native app**
3. 🔄 **Replace mock SMS** with real provider (Twilio/AWS SNS)
4. 🔄 **Deploy to production** (AWS, DigitalOcean, etc.)
5. 🔄 **Add more features** (profiles, matching, chat)

## 📖 Full Documentation

See [README.md](./README.md) for complete API documentation and deployment guides.
