# Backend-Frontend Integration Documentation

## Overview
Complete integration between NestJS backend and React Native frontend for OTP-based authentication system.

---

## 🔗 Integration Architecture

```
React Native App (Mobile)
         ↓
    API Service Layer (services/api.ts)
         ↓
    Network (HTTP/JSON)
         ↓
    NestJS Backend (localhost:3000 / 10.192.244.241:3000)
         ↓
    MongoDB Atlas + Redis
```

---

## 📡 Integrated API Endpoints

### 1. Request OTP
**Endpoint**: `POST /auth/request-otp`

**Frontend Integration**:
- File: `app/login/index.tsx`
- Function: `handleContinue()`
- Triggers on: "Continue" button click

**Request Body**:
```json
{
  "phoneNumber": "+919876543210"
}
```

**Response**:
```json
{
  "message": "OTP sent successfully"
}
```

**Backend Processing**:
1. Validates phone number format
2. Checks rate limiting (3 attempts per 10 min)
3. Generates secure 6-digit OTP
4. Hashes OTP with SHA256
5. Stores in Redis with 5-minute TTL
6. Logs OTP to console (mock SMS)
7. Returns success message

---

### 2. Verify OTP
**Endpoint**: `POST /auth/verify-otp`

**Frontend Integration**:
- File: `app/otp-verification/index.tsx`
- Function: `handleVerify()`
- Triggers on: "Verify" button click

**Request Body**:
```json
{
  "phoneNumber": "+919876543210",
  "otp": "802844"
}
```

**Response**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "65f1234567890abcdef12345",
    "phoneNumber": "+919876543210",
    "isVerified": true
  }
}
```

**Backend Processing**:
1. Retrieves hashed OTP from Redis
2. Compares with provided OTP (hashed)
3. Creates or updates user in MongoDB
4. Marks user as verified
5. Generates JWT access token (15 min expiry)
6. Generates JWT refresh token (7 days expiry)
7. Stores hashed refresh token in database
8. Deletes OTP from Redis
9. Returns tokens + user data

**Frontend Actions**:
1. Stores `accessToken` in AsyncStorage
2. Stores `refreshToken` in AsyncStorage
3. Stores `user` object in AsyncStorage
4. Navigates to `/profile-setup/basic-info`

---

### 3. Refresh Token
**Endpoint**: `POST /auth/refresh`

**Frontend Integration**:
- File: `services/api.ts`
- Function: `refreshToken()`
- Usage: When access token expires

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Backend Processing**:
1. Verifies refresh token signature
2. Checks token hasn't expired
3. Validates against stored hash in database
4. Generates new access token
5. Generates new refresh token (rotation)
6. Updates stored refresh token in database
7. Returns new token pair

---

## 🔐 Authentication Flow

### Complete User Journey

```
1. User enters phone number
   ↓
2. App → POST /auth/request-otp
   ↓
3. Backend generates OTP → Stores in Redis → Logs to console
   ↓
4. User sees OTP in backend console (mock SMS)
   ↓
5. User enters OTP in app
   ↓
6. App → POST /auth/verify-otp
   ↓
7. Backend verifies OTP → Creates user → Generates JWT tokens
   ↓
8. App receives tokens → Stores in AsyncStorage
   ↓
9. App navigates to profile setup
   ↓
10. User is authenticated ✅
```

---

## 📱 Frontend Components

### API Service Layer
**File**: `services/api.ts`

**Features**:
- Centralized HTTP client
- TypeScript type definitions
- Error handling
- Token management helpers

**Key Functions**:
```typescript
api.requestOTP(phoneNumber: string)
api.verifyOTP(phoneNumber: string, otp: string)
api.refreshToken(refreshToken: string)
api.authenticatedRequest(endpoint, token, options)
```

### Login Screen
**File**: `app/login/index.tsx`

**Integrated Features**:
- Phone number input with validation
- API call to request OTP
- Loading states during API calls
- Error handling with alerts
- Navigation to OTP screen with phone number

### OTP Verification Screen
**File**: `app/otp-verification/index.tsx`

**Integrated Features**:
- 6-digit OTP input
- API call to verify OTP
- Resend OTP functionality
- Token storage in AsyncStorage
- Loading states
- Error handling
- Navigation to profile setup on success

---

## 🗄️ Backend Data Store

### MongoDB Atlas
**Collection**: `users`

**Schema**:
```typescript
{
  _id: ObjectId
  phoneNumber: string (unique, indexed)
  isVerified: boolean
  refreshToken: string (hashed)
  createdAt: Date
  updatedAt: Date
  lastLoginAt: Date
}
```

### Redis
**Keys**:
```
otp:{phoneNumber}           → Hashed OTP (TTL: 5 min)
otp:ratelimit:{phoneNumber} → Attempt count (TTL: 10 min)
```

---

## 🔒 Security Features

### Implemented
1. **OTP Hashing**: SHA256 before storage
2. **JWT Tokens**: HS256 signature algorithm
3. **Refresh Token Rotation**: New tokens on each refresh
4. **Rate Limiting**: 3 OTP requests per 10 minutes
5. **Token Expiry**: Access (15 min), Refresh (7 days)
6. **CORS**: Enabled for mobile app origins
7. **Input Validation**: DTO validation with class-validator
8. **Phone Format**: Validates E.164 format (+919876543210)

### Not Implemented (Production TODO)
- Real SMS provider (Twilio/AWS SNS)
- HTTPS/SSL certificates
- API key authentication
- Redis password protection
- Environment-specific secrets
- Production error handling

---

## 🌐 Network Configuration

### Backend
**Host**: `0.0.0.0` (listens on all network interfaces)
**Port**: `3000`

### Frontend Environment
**File**: `.env`
```bash
EXPO_PUBLIC_API_URL=http://10.192.244.241:3000
```

**For Different Environments**:
- **Local (web)**: `http://localhost:3000`
- **Mobile (same network)**: `http://192.168.x.x:3000` or `http://10.x.x.x:3000`
- **Android Emulator**: `http://10.0.2.2:3000`
- **Production**: `https://api.yourdomain.com`

---

## 📦 Dependencies

### Backend
```json
{
  "@nestjs/mongoose": "MongoDB integration",
  "@nestjs/jwt": "JWT token generation",
  "@nestjs/passport": "Authentication strategies",
  "redis": "OTP and rate limiting storage",
  "bcrypt": "Password/token hashing",
  "class-validator": "DTO validation"
}
```

### Frontend
```json
{
  "@react-native-async-storage/async-storage": "Token persistence",
  "expo-router": "Navigation",
  "@expo/vector-icons": "UI icons"
}
```

---

## 🧪 Testing Status

### ✅ Verified Working
- [x] Network connectivity (mobile → backend)
- [x] OTP request flow
- [x] OTP generation and storage
- [x] OTP verification
- [x] JWT token generation
- [x] Token storage in AsyncStorage
- [x] User creation in MongoDB
- [x] Redis integration
- [x] Rate limiting
- [x] Error handling
- [x] Navigation flow

### 🔄 Pending (Production)
- [ ] Real SMS integration
- [ ] SSL/HTTPS setup
- [ ] Production deployment
- [ ] Load testing
- [ ] Security audit

---

## 📝 Environment Variables

### Backend (.env)
```bash
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
OTP_LENGTH=6
OTP_EXPIRY=300
OTP_MAX_ATTEMPTS=3
```

### Frontend (.env)
```bash
EXPO_PUBLIC_API_URL=http://10.192.244.241:3000
```

---

## 🚀 Quick Start Guide

### Backend
```bash
cd backend
npm install
npm run start:dev
```

### Frontend
```bash
npm install
npx expo start --tunnel
```

### Test Flow
1. Open app on phone
2. Enter: `9876543210`
3. Check backend console for OTP
4. Enter OTP in app
5. Success! → Profile setup

---

## 📊 Current System Status

| Component | Status | Notes |
|-----------|--------|-------|
| Backend API | ✅ Running | Port 3000, network accessible |
| MongoDB Atlas | ✅ Connected | User storage working |
| Redis | ✅ Connected | OTP storage working |
| Frontend App | ✅ Running | Expo tunnel mode |
| API Integration | ✅ Complete | All endpoints working |
| Authentication | ✅ Working | Full OTP → JWT flow |
| Network | ✅ Fixed | Mobile can reach backend |

---

## 🔮 Next Steps

### Immediate
1. Build profile completion screens
2. Add user profile photos (expo-image-picker)
3. Implement bio/interests collection

### Short Term
1. Replace mock SMS with Twilio/AWS SNS
2. Add profile display screens
3. Build matching algorithm
4. Create chat functionality

### Production
1. Deploy backend to cloud (AWS/Heroku/DigitalOcean)
2. Configure production MongoDB cluster
3. Set up Redis in production
4. Enable HTTPS/SSL
5. Configure production environment variables
6. Set up monitoring and logging
7. Implement rate limiting at API gateway level

---

**Last Updated**: February 8, 2026  
**Status**: ✅ Fully Integrated and Working  
**Author**: Antigravity AI
