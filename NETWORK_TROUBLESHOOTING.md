# Quick Network Troubleshooting

## Still Getting Network Error?

Try these steps in order:

### 1. Restart Expo with --clear flag
The `.env` file needs a full restart to be loaded:

```bash
# Stop current Expo server (Ctrl+C in the terminal)
# Then run:
npx expo start --tunnel --clear
```

### 2. Check Backend is Accessible
Open this URL in your phone's browser:
```
http://10.192.244.241:3000
```

You should see a message from the backend. If you can't open it, the issue is network connectivity.

### 3. Allow Through Windows Firewall
Run this in PowerShell **as Administrator**:

```powershell
New-NetFirewallRule -DisplayName "Node.js Backend" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

### 4. Restart Backend on Network Interface
In the backend folder, restart the server to listen on all interfaces:

```bash
# The server should already be configured for this, but if not:
# Stop current backend (Ctrl+C)
# Then restart:
npm run start:dev
```

### 5. Test API from Phone Browser
Open in your phone's browser:
```
http://10.192.244.241:3000/health
```

If this works, the mobile app should work too after restarting Expo.

---

## Alternative: Use Tunnel Mode Only

If network connectivity is too complex, you can proxy through ngrok (already enabled with `--tunnel`):

Update `services/api.ts` to use the tunnel URL:
```typescript
const API_BASE_URL = 'https://your-tunnel-url.ngrok.io';
```

The tunnel URL is shown when you start Expo with `--tunnel`.
