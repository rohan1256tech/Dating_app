# dev-start.ps1
# ─────────────────────────────────────────────────────────────────────────────
# WhatsLeft Dev Launcher
# By default, uses the Cloud Run production backend.
# Pass -LocalMode to switch to local backend (auto-detects WiFi IP).
# Usage: .\dev-start.ps1              → uses Cloud Run backend
#        .\dev-start.ps1 -LocalMode   → uses local backend on WiFi IP:3000
# ─────────────────────────────────────────────────────────────────────────────

param(
    [switch]$LocalMode
)

$ErrorActionPreference = "Stop"
$envPath = Join-Path $PSScriptRoot ".env"
$cloudRunUrl = "https://detto-backend-53328021014.us-central1.run.app"

if ($LocalMode) {
    # Find WiFi IP (prefer non-WSL, non-loopback, non-APIPA)
    $ip = (Get-NetIPAddress -AddressFamily IPv4 |
        Where-Object {
            $_.InterfaceAlias -like "*Wi-Fi*" -or
            $_.InterfaceAlias -like "*Wireless*" -or
            $_.InterfaceAlias -like "*WLAN*"
        } |
        Where-Object { $_.IPAddress -notlike "169.*" -and $_.IPAddress -ne "127.0.0.1" } |
        Select-Object -First 1).IPAddress

    if (-not $ip) {
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

    $newUrl = "EXPO_PUBLIC_API_URL=http://${ip}:3000"
    Write-Host "✅ LOCAL MODE — using backend at http://${ip}:3000" -ForegroundColor Yellow

    # Start local backend in a new window
    Write-Host "🚀 Starting NestJS backend..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend'; npm run start:dev"
    Start-Sleep -Seconds 3
} else {
    $newUrl = "EXPO_PUBLIC_API_URL=$cloudRunUrl"
    Write-Host "✅ PRODUCTION MODE — using Cloud Run backend: $cloudRunUrl" -ForegroundColor Green
}

# Update frontend .env
Set-Content -Path $envPath -Value $newUrl -NoNewline
Write-Host "✅ Updated .env → $newUrl" -ForegroundColor Green

# Start Expo in LAN mode
Write-Host "📱 Starting Expo (LAN mode)..." -ForegroundColor Cyan
Write-Host "   Scan the QR code with Expo Go — make sure your phone is on the same WiFi" -ForegroundColor Yellow
npx expo start --lan
