# setup_service.ps1
# RUN THIS AS ADMINISTRATOR

$ServiceName = "ApexTradingPipeline"
$NssmPath = Join-Path $PSScriptRoot "nssm\nssm.exe"
$WorkingDir = (Get-Item $PSScriptRoot).Parent.FullName
$PythonPath = Join-Path $WorkingDir ".venv\Scripts\python.exe"
$AppPath = Join-Path $WorkingDir "src\pipeline\main.py"

Write-Host "--- Configuring Apex Trading Pipeline Service ---" -ForegroundColor Cyan

# 1. Install or Update service
Write-Host "Registering/Updating service..."
& $NssmPath install $ServiceName $PythonPath "-m src.pipeline.main" 2>$null
& $NssmPath set $ServiceName Application $PythonPath
& $NssmPath set $ServiceName AppParameters "-m src.pipeline.main"
& $NssmPath set $ServiceName AppDirectory $WorkingDir

# 2. Resiliency Settings
Write-Host "Setting restart delay to 10 seconds..."
& $NssmPath set $ServiceName AppRestartDelay 10000

Write-Host "Setting throttled restart delay to 20 seconds..."
& $NssmPath set $ServiceName AppThrottle 20000

# 3. Startup Settings
Write-Host "Setting startup type to Automatic (Delayed Start)..."
# Note: NSSM doesn't directly set 'Delayed' via command line, but we can use sc config
& $NssmPath set $ServiceName Start SERVICE_AUTO_START
sc.exe config $ServiceName start= delayed-auto

# 4. Logging
$LogPath = Join-Path $WorkingDir "logs\service_out.log"
& $NssmPath set $ServiceName AppStdout $LogPath
& $NssmPath set $ServiceName AppStderr $LogPath

Write-Host "--- Finalize ---" -ForegroundColor Green
Write-Host "To start the service, run: Start-Service $ServiceName (as Admin)"
Write-Host "To manage: tools\nssm\nssm.exe edit $ServiceName (as Admin)"
