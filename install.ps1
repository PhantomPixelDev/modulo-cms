<#
.SYNOPSIS
    Modulo CMS installer for Windows (Docker Desktop or Podman Desktop).

.DESCRIPTION
    Download it, read it, then run it. Running a script straight from the
    internet means running code you have not seen.

        Invoke-WebRequest -Uri https://raw.githubusercontent.com/PhantomPixelDev/modulo-cms/main/install.ps1 -OutFile install.ps1
        Get-Content install.ps1
        .\install.ps1

    Creates a directory, writes a .env with generated secrets, starts the
    stack, and prints the URL to finish setup in a browser. Nothing outside the
    directory it creates is modified.

.PARAMETER WebPort
    Host port for the site. Defaults to 8080.

.PARAMETER Directory
    Directory to install into. Defaults to modulo-cms.

.PARAMETER Tag
    Release to install. Defaults to the latest published release.
#>

[CmdletBinding()]
param(
    [int]$WebPort = 8080,
    [string]$Directory = 'modulo-cms',
    [string]$Tag = ''
)

$ErrorActionPreference = 'Stop'

$Repo = 'PhantomPixelDev/modulo-cms'

function Write-Ok { param($Message) Write-Host "  [ok] $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "  $Message" }
function Write-Warn { param($Message) Write-Host "  [!] $Message" -ForegroundColor Yellow }
function Stop-WithError { param($Message) Write-Host "`n  [x] $Message`n" -ForegroundColor Red; exit 1 }

Write-Host "`n  Modulo CMS installer`n"

# --- Prerequisites ----------------------------------------------------------

$runtime = $null
foreach ($candidate in @('docker', 'podman')) {
    if (Get-Command $candidate -ErrorAction SilentlyContinue) { $runtime = $candidate; break }
}

if (-not $runtime) {
    Stop-WithError 'Neither Docker nor Podman is installed. Install Docker Desktop and run this again.'
}
Write-Ok "Container runtime: $runtime"

& $runtime compose version *> $null
if ($LASTEXITCODE -ne 0) {
    Stop-WithError "'$runtime compose' is not available. Update Docker Desktop and run this again."
}
Write-Ok 'Compose available'

& $runtime info *> $null
if ($LASTEXITCODE -ne 0) {
    Stop-WithError "$runtime is installed but not running. Start Docker Desktop and run this again."
}
Write-Ok "$runtime is running"

# --- Port -------------------------------------------------------------------

$listening = Get-NetTCPConnection -LocalPort $WebPort -State Listen -ErrorAction SilentlyContinue
if ($listening) {
    Stop-WithError "Port $WebPort is already in use. Re-run with: .\install.ps1 -WebPort 8081"
}
Write-Ok "Port $WebPort is free"

# --- Target directory -------------------------------------------------------

if (Test-Path $Directory) {
    Stop-WithError "'$Directory' already exists. Remove it, or pass -Directory with another name."
}

New-Item -ItemType Directory -Path $Directory | Out-Null
Set-Location $Directory
Write-Ok "Created $Directory/"

# --- Release ----------------------------------------------------------------

# Pin to a published release rather than a moving branch, so an install is
# reproducible.
if (-not $Tag) {
    try {
        $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest" -ErrorAction Stop
        $Tag = $release.tag_name
    } catch {
        $Tag = ''
    }
}

if ($Tag) {
    $ref = $Tag
    Write-Ok "Release: $Tag"
} else {
    Write-Warn 'No published release found yet; using the main branch.'
    $ref = 'main'
    $Tag = 'latest'
}

$base = "https://raw.githubusercontent.com/$Repo/$ref"
try {
    Invoke-WebRequest -Uri "$base/docker/docker-compose.yml" -OutFile 'docker-compose.yml' -UseBasicParsing
    Invoke-WebRequest -Uri "$base/.env.prod.example" -OutFile '.env.prod.example' -UseBasicParsing
} catch {
    Stop-WithError "Could not download the deployment files for $ref."
}
# The site helper is a POSIX shell script (usable from WSL or Git Bash);
# optional, so a failed download only warns.
try {
    Invoke-WebRequest -Uri "$base/docker/modulo" -OutFile 'modulo' -UseBasicParsing
} catch {
    Write-Warn 'Could not download the ./modulo helper; updates can still be run by hand.'
}
Write-Ok 'Downloaded deployment files'

# --- Configuration ----------------------------------------------------------

function New-RandomSecret {
    param([int]$Bytes = 32)
    $buffer = [byte[]]::new($Bytes)
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($buffer)
    return [Convert]::ToBase64String($buffer)
}

$appKey = 'base64:' + (New-RandomSecret -Bytes 32)
$dbPassword = (New-RandomSecret -Bytes 24) -replace '[/+=]', ''
$appUrl = "http://localhost:$WebPort"

# Rewrite the template in place so settings added upstream survive rather than
# being silently dropped.
$content = Get-Content '.env.prod.example' -Raw
$content = $content -replace '(?m)^APP_KEY=.*$', "APP_KEY=$appKey"
$content = $content -replace '(?m)^APP_URL=.*$', "APP_URL=$appUrl"
$content = $content -replace '(?m)^DB_PASSWORD=.*$', "DB_PASSWORD=$dbPassword"
$content = $content -replace '(?m)^WEB_PORT=.*$', "WEB_PORT=$WebPort"
# The git tag is vX.Y.Z; the image tag is the bare X.Y.Z.
$content = $content -replace '(?m)^MODULO_TAG=.*$', "MODULO_TAG=$($Tag.TrimStart('v'))"

# Written as .env, which compose reads on its own, so plain "docker compose
# pull / up / exec" work in this directory without --env-file. The compose
# file's env_file defaults to ../.env.prod (its place in a repository
# checkout); point it here instead.
$content = $content.TrimEnd() + "`n`n# Where the containers read this file from (set by the installer).`nMODULO_ENV_FILE=.env`n"
# UTF-8 without a BOM: a BOM on the first line would become part of the first
# variable's name and the application would not see it.
[System.IO.File]::WriteAllText((Join-Path $PWD '.env'), $content, [System.Text.UTF8Encoding]::new($false))
Remove-Item '.env.prod.example' -ErrorAction SilentlyContinue
Write-Ok 'Generated .env with a unique application key and database password'

# Compose prefers the process environment over .env; a stray MODULO_TAG
# there would override the image tag written above.
$env:MODULO_TAG = $Tag.TrimStart('v')

# --- Start ------------------------------------------------------------------

Write-Info 'Starting the stack. The first run downloads images and may take a few minutes.'

& $runtime compose pull
if ($LASTEXITCODE -ne 0) {
    Write-Warn 'Could not pull published images.'
    Write-Warn 'If no release exists yet, clone the repository and use: MODULO_BUILD=1 ./modulo.sh up prod'
    Stop-WithError 'Aborting.'
}

& $runtime compose up -d
if ($LASTEXITCODE -ne 0) {
    Stop-WithError "The stack failed to start. Check: $runtime compose logs"
}

# --- Wait for health --------------------------------------------------------

Write-Info 'Waiting for the site to come up...'
$ready = $false
foreach ($attempt in 1..60) {
    try {
        Invoke-WebRequest -Uri "http://localhost:$WebPort/health" -UseBasicParsing -TimeoutSec 5 | Out-Null
        $ready = $true
        break
    } catch {
        Start-Sleep -Seconds 3
    }
}

if (-not $ready) {
    Write-Warn 'The site did not respond in time. It may still be starting.'
    Write-Warn "Check with: cd $Directory; $runtime compose logs"
} else {
    Write-Ok 'The site is up'
}

Write-Host "`n  Ready. Open this to finish setup:`n" -ForegroundColor Green
Write-Host "    http://localhost:$WebPort/install`n"
Write-Info "Your secrets are in $Directory\.env - keep it, and do not commit it."
Write-Info "Stop the site with:  cd $Directory; $runtime compose down"
Write-Info "To update later: set MODULO_TAG in .env to the new version, then run"
Write-Info "                 $runtime compose pull; $runtime compose up -d   (or ./modulo update from WSL/Git Bash)"
Write-Host ''
