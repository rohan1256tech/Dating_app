# Redis Installation Guide for Windows

The dating app backend needs Redis for OTP storage. Here are 3 ways to install it:

## Option 1: Docker Desktop (Recommended - Easiest)

### Install Docker Desktop
1. Download: https://www.docker.com/products/docker-desktop/
2. Install and restart your computer
3. Open Docker Desktop and wait for it to start

### Run Redis Container
```powershell
docker run -d -p 6379:6379 --name dating-app-redis redis:7-alpine
```

### Verify it's running
```powershell
docker ps
```

You should see `dating-app-redis` in the list.

### Stop/Start Redis
```powershell
# Stop
docker stop dating-app-redis

# Start again
docker start dating-app-redis

# Remove (if you want to start fresh)
docker rm -f dating-app-redis
```

---

## Option 2: Windows Subsystem for Linux (WSL2)

### Install WSL2
```powershell
wsl --install
```

Restart your computer after installation.

### Install Redis in WSL
```bash
# Open WSL terminal
wsl

# Update packages
sudo apt-get update

# Install Redis
sudo apt-get install redis-server

# Start Redis
sudo service redis-server start

# Verify it's running
redis-cli ping
# Should return: PONG
```

### Auto-start Redis (WSL)
Add to `~/.bashrc`:
```bash
sudo service redis-server start
```

---

## Option 3: Native Windows (Older Version)

> ⚠️ Note: Official Redis doesn't support Windows, but Microsoft maintains a fork

### Download
https://github.com/microsoftarchive/redis/releases

Download the `.msi` installer (latest version)

### Install
1. Run the `.msi` file
2. Check "Add to PATH"
3. Complete installation

### Start Redis
```powershell
redis-server
```

---

## After Redis is Running

### Test Redis Connection
```powershell
redis-cli ping
```

Should return: **PONG**

### Restart Backend Server
The backend will auto-reconnect to Redis:

```bash
cd backend
npm run start:dev
```

You should see:
```
✅ MongoDB Atlas connected successfully
✅ Redis Client Connected
```

---

## Verify Everything Works

1. **Start Redis** (using one of the methods above)
2. **Start Backend** (`cd backend && npm run start:dev`)
3. **Start Frontend** (`npx expo start`)
4. **Test OTP Flow**:
   - Open app
   - Enter phone number: `9876543210`
   - Click "Continue"
   - Check backend console for OTP
   - Enter the OTP
   - Should login successfully!

---

## Quick Reference

### Docker Commands
```bash
# Start
docker start dating-app-redis

# Stop
docker stop dating-app-redis

# Logs
docker logs dating-app-redis

# Remove
docker rm -f dating-app-redis
```

### WSL Commands
```bash
# Start Redis
sudo service redis-server start

# Stop Redis
sudo service redis-server stop

# Check status
sudo service redis-server status
```

### Native Windows
```bash
# Just run
redis-server
```

---

**Recommended**: Use Docker Desktop - it's the easiest and most reliable method!
