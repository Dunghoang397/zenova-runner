# ZENOVA SHOP - Bot Watchdog (auto-restart khi crash)
$ErrorActionPreference = 'Continue'
$botDir = $PSScriptRoot
$logDir = Join-Path $botDir 'logs'
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Force -Path $logDir | Out-Null }

$mainLog = Join-Path $logDir 'watchdog.log'
$botLog = Join-Path $logDir 'bot.log'

function Log($msg) {
    $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $line = "[$ts] $msg"
    Write-Host $line -ForegroundColor Cyan
    Add-Content -Path $mainLog -Value $line -Encoding UTF8
}

Log "=== ZENOVA WATCHDOG START ==="

# Kill bot cu neu co
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep 2

$restartCount = 0
$maxRestarts = 999

while ($restartCount -lt $maxRestarts) {
    $restartCount++
    Log "--- Bot start (lan $restartCount) ---"

    $startTime = Get-Date

    try {
        $proc = Start-Process -FilePath 'node' `
            -ArgumentList 'src\index.js' `
            -WorkingDirectory $botDir `
            -NoNewWindow `
            -PassThru `
            -RedirectStandardOutput $botLog `
            -RedirectStandardError "$botLog.err"

        $proc.WaitForExit()

        $exitCode = $proc.ExitCode
        $uptime = (Get-Date) - $startTime
        Log "Bot exited (code: $exitCode, uptime: $($uptime.TotalSeconds)s)"
    } catch {
        Log "Loi khoi dong bot: $($_.Exception.Message)"
        $uptime = [TimeSpan]::FromSeconds(0)
    }

    $waitSec = 5
    if ($uptime.TotalSeconds -lt 30) {
        $waitSec = 15
        Log "Bot crash som, cho ${waitSec}s..."
    } else {
        Log "Bot chay $([math]::Round($uptime.TotalMinutes, 1)) phut, restart sau ${waitSec}s..."
    }

    Start-Sleep -Seconds $waitSec
}

Log "=== WATCHDOG EXIT ==="