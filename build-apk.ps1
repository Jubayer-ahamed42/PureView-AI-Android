# =============================================================================
# PureView AI - Android APK Builder & Asset Sync Script (PowerShell)
# =============================================================================

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  PureView AI - 100% Android APK Build & Sync Pipeline" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# Step 1: Build Web Assets & Copy Pre-trained AI Models
Write-Host "`n[1/3] Building Web Assets, AI Models & Test Images..." -ForegroundColor Yellow
node scripts/build-web.js

# Step 2: Sync public/ into Android WebView assets (android/app/src/main/assets/public)
$AndroidAssetsDir = Join-Path $ProjectRoot "android\app\src\main\assets\public"
Write-Host "`n[2/3] Syncing PureView AI bundle into Android WebView assets..." -ForegroundColor Yellow
if (Test-Path $AndroidAssetsDir) {
    Remove-Item -Recurse -Force $AndroidAssetsDir
}
New-Item -ItemType Directory -Force -Path $AndroidAssetsDir | Out-Null
Copy-Item -Recurse -Force (Join-Path $ProjectRoot "public\*") $AndroidAssetsDir
Write-Host "  -> Synced all HTML/CSS/JS, AI Models, and Test Images to android/app/src/main/assets/public" -ForegroundColor Green

# Step 3: Check for JDK & Android SDK to compile APK
Write-Host "`n[3/3] Checking Android SDK & Java JDK environment..." -ForegroundColor Yellow

$JavaCandidates = @(
    $env:JAVA_HOME,
    "C:\Program Files\Android\Android Studio\jbr",
    "C:\Program Files\Java\jdk-17",
    "C:\Program Files\Eclipse Adoptium\jdk-17"
) | Where-Object { $_ -and (Test-Path (Join-Path $_ "bin\java.exe")) }

$SdkCandidates = @(
    $env:ANDROID_HOME,
    $env:ANDROID_SDK_ROOT,
    "$env:LOCALAPPDATA\Android\Sdk"
) | Where-Object { $_ -and (Test-Path $_) }

if ($JavaCandidates.Count -gt 0 -and $SdkCandidates.Count -gt 0) {
    $env:JAVA_HOME = $JavaCandidates[0]
    $env:ANDROID_HOME = $SdkCandidates[0]
    Write-Host "  -> Found JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Green
    Write-Host "  -> Found ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Green

    $GradleCmd = Get-Command gradle -ErrorAction SilentlyContinue
    if (Test-Path (Join-Path $ProjectRoot "android\gradlew.bat")) {
        Set-Location (Join-Path $ProjectRoot "android")
        .\gradlew.bat assembleDebug
        Set-Location $ProjectRoot
    } elseif ($GradleCmd) {
        Set-Location (Join-Path $ProjectRoot "android")
        gradle assembleDebug
        Set-Location $ProjectRoot
    }

    $ApkOut = Join-Path $ProjectRoot "android\app\build\outputs\apk\debug\app-debug.apk"
    if (Test-Path $ApkOut) {
        Copy-Item -Force $ApkOut (Join-Path $ProjectRoot "PureView-AI-Android.apk")
        Write-Host "`n[SUCCESS] APK Built Successfully: PureView-AI-Android.apk" -ForegroundColor Green
    }
} else {
    Write-Host "  -> Android project & assets are 100% synced and ready inside .\android\" -ForegroundColor Green
    Write-Host "  -> Note: Android Studio / JDK was not detected in PATH on this PC." -ForegroundColor Cyan
    Write-Host "     Option A (Instant Mobile Install via Wi-Fi PWA): Run 'npm start' and open the LAN URL on your Android phone -> Tap 'Install App'." -ForegroundColor White
    Write-Host "     Option B (Native APK): Open the '.\android' folder in Android Studio -> Build > Build APK(s)." -ForegroundColor White
}
