# dev-start.ps1
# ─────────────────────────────────────────────────────────────────────────────
# Detto Dev Launcher
# Auto-detects WiFi IP, updates frontend .env, then starts backend + Expo LAN
# Usage: .\dev-start.ps1
# ─────────────────────────────────────────────────────────────────────────────

$ErrorActionPreference = "Stop"

# 1. Find WiFi IP (prefer non-WSL, non-loopback, non-APIPA)
$ip = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
        $_.InterfaceAlias -like "*Wi-Fi*" -or
        $_.InterfaceAlias -like "*Wireless*" -or
        $_.InterfaceAlias -like "*WLAN*"
    } |
    Where-Object { $_.IPAddress -notlike "169.*" -and $_.IPAddress -ne "127.0.0.1" } |
    Select-Object -First 1).IPAddress

if (-not $ip) {
    # Fallback: any non-loopback, non-APIPA, non-WSL address
    $ip = (Get-NetIPAddress -AddressFamily IPv4 |
        Where-Object {
            $_.InterfaceAlias -notlike "*Loopback*" -and
            $_.InterfaceAlias -notlike "*WSL*" -and
            $_.InterfaceAlias -notlike "*vEthernet*" -and
            $_.IPAddress -notlike "169.*" -and
            $_.IPAddress -ne "127.0.0.1"
        } |
        Select-Object -First 1).IPAddress
}

if (-not $ip) {
    Write-Host "❌ Could not detect WiFi IP. Connect to WiFi first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Detected WiFi IP: $ip" -ForegroundColor Green

# 2. Update frontend .env
$envPath = Join-Path $PSScriptRoot ".env"
$newUrl  = "EXPO_PUBLIC_API_URL=http://${ip}:3000"

if (Test-Path $envPath) {
    $content = Get-Content $envPath -Raw
    # Replace existing EXPO_PUBLIC_API_URL line
    $updated = $content -replace "EXPO_PUBLIC_API_URL=http://[\d\.]+:\d+", $newUrl
    Set-Content -Path $envPath -Value $updated.TrimEnd() -NoNewline
} else {
    Set-Content -Path $envPath -Value $newUrl
}
Write-Host "✅ Updated .env → $newUrl" -ForegroundColor Green

# 3. Start backend in new window
Write-Host "🚀 Starting NestJS backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend'; npm run start:dev"

Start-Sleep -Seconds 3

# 4. Start Expo in LAN mode (no ngrok, no tunnel)
Write-Host "📱 Starting Expo (LAN mode)..." -ForegroundColor Cyan
Write-Host "   Scan the QR code with Expo Go — make sure your phone is on the same WiFi" -ForegroundColor Yellow
npx expo start --lan
