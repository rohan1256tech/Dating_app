# Dating App Backend

A production-ready NestJS backend with OTP authentication for a React Native mobile dating application.

## 🚀 Features

- **OTP Authentication**: Secure phone number verification via SMS
- **JWT Tokens**: Access (15min) + Refresh (7 days) token system
- **MongoDB Atlas**: Cloud database with connection retry logic
- **Redis**: Fast OTP storage with auto-expiry
- **Rate Limiting**: Prevents OTP spam (3 attempts per 10 minutes)
- **Input Validation**: DTOs with class-validator
- **Global Error Handling**: Centralized exception filter
- **Request Logging**: Automatic HTTP request/response logging
- **CORS Enabled**: Mobile app ready
- **Docker Ready**: Multi-stage Dockerfile + docker-compose

## 📋 Prerequisites

- Node.js 20+
- npm or yarn
- Redis (local or Docker)
- MongoDB Atlas account

## 🔧 Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your MongoDB Atlas URI
```

## ⚙️ Environment Variables

See `.env.example` for all configuration options. Key variables:

- `MONGODB_URI`: Your MongoDB Atlas connection string
- `REDIS_HOST`: Redis server host
- `JWT_ACCESS_SECRET`: Secret for access tokens
- `JWT_REFRESH_SECRET`: Secret for refresh tokens

## 🏃 Running the App

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

### Docker
```bash
docker-compose up
```

## 📡 API Endpoints

### Authentication

#### Request OTP
```http
POST /auth/request-otp
Content-Type: application/json

{
  "phoneNumber": "+919876543210"
}
```

**Response:**
```json
{
  "message": "OTP sent successfully"
}
```

#### Verify OTP
```http
POST /auth/verify-otp
Content-Type: application/json

{
  "phoneNumber": "+919876543210",
  "otp": "123456"
}
```

**Response:**
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

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

## 🔒 Protected Routes

Use the JWT guard on any route:

```typescript
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Request() req) {
  return req.user;
}
```

## 📁 Project Structure

```
src/
├── auth/                 # Authentication module
│   ├── dto/             # Request/response DTOs
│   ├── guards/          # JWT auth guards
│   ├── strategies/      # Passport strategies
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── users/               # User management
│   ├── dto/
│   ├── user.schema.ts
│   ├── users.service.ts
│   └── users.module.ts
├── otp/                 # OTP service
│   ├── otp.service.ts
│   └── otp.module.ts
├── common/              # Shared utilities
│   ├── filters/         # Exception filters
│   ├── interceptors/    # Request interceptors
│   └── utils/           # Helper functions
├── config/              # Configuration
│   └── configuration.ts
├── app.module.ts
└── main.ts
```

## 🔐 Security Features

- **OTP Hashing**: OTPs stored as SHA256 hashes
- **Rate Limiting**: Throttle protection on all endpoints
- **Input Validation**: Strict DTO validation
- **JWT Rotation**: Refresh token rotation on use
- **CORS**: Configured for mobile apps
- **Environment Secrets**: All sensitive data in .env

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📊 Database Schema

### User Model
```typescript
{
  phoneNumber: string (unique, indexed)
  isVerified: boolean
  lastLoginAt: Date
  refreshToken: string (hashed)
  createdAt: Date
  updatedAt: Date
}
```

### OTP Storage (Redis)
```
Key: otp:{phoneNumber}
Value: <hashed_otp>
TTL: 300 seconds (5 minutes)
```

## 🚧 Future Enhancements

- [ ] Match system
- [ ] Real-time chat (WebSocket)
- [ ] Payment integration
- [ ] Media upload (photos/videos)
- [ ] Geolocation-based matching
- [ ] Push notifications

## 📝 License

MIT

## 👨‍💻 Author

Dating App Team
