# One-command local start (Windows). Run from repo root: .\scripts\dev.ps1
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "Starting MySQL (Docker, port 3307)..."
docker compose up mysql -d
if ($LASTEXITCODE -ne 0) {
  throw "Docker failed. Start Docker Desktop and retry."
}

if (-not (Test-Path "server\.env")) {
  Copy-Item "server\.env.example" "server\.env"
  Write-Host "Created server\.env from example"
}
if (-not (Test-Path "client\.env")) {
  Copy-Item "client\.env.example" "client\.env"
  Write-Host "Created client\.env from example"
}

Write-Host "Installing npm workspaces..."
npm install

Write-Host "Migrating and seeding..."
Push-Location server
npx prisma migrate deploy
npm run prisma:seed
npm run seed:demo
Pop-Location

Write-Host "API http://localhost:4000/api/health"
Write-Host "App http://localhost:5173"
Write-Host "Demo login: candidate@demo.com / Demo1234"
npm run dev
