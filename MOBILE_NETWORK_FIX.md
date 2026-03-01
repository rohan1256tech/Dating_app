# Mobile Testing - Network Connection Fix

## Problem
You're getting **"Network request failed"** because your phone can't reach `localhost:3000`. On a mobile device, `localhost` refers to the phone itself, not your computer!

## Quick Fix

### Step 1: Find Your Computer's IP Address
I ran `ipconfig` - look for the IPv4 address (usually starts with `192.168.x.x` or `10.0.x.x`)

### Step 2: Create .env File
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and replace with your IP:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.1.XXX:3000
   ```
   (Replace `192.168.1.XXX` with your actual IP from Step 1)

### Step 3: Restart Expo
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npx expo start --tunnel --clear
```

## Alternative: Quick Test Without .env

You can also directly edit `services/api.ts` line 4:
```typescript
const API_BASE_URL = 'http://192.168.1.XXX:3000';  // Your IP here
```

Then press `r` in the Expo terminal to reload the app.

---

## Testing After Fix

1. **Request OTP**: Enter phone `9876543210` → Click "Continue"
2. **Check Backend Console**: Look for the OTP (e.g., `456789`)
3. **Verify OTP**: Enter the code → Should login successfully!

The backend is running with in-memory storage, so it will work instantly once the network connection is fixed.
