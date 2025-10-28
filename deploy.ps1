# PowerShell deployment script for GitHub Pages

Write-Host "Setting environment variables..." -ForegroundColor Cyan

$env:REACT_APP_API_URL="http://ec2-35-154-111-148.ap-south-1.compute.amazonaws.com:3001"
$env:REACT_APP_SOCKET_URL="http://ec2-35-154-111-148.ap-south-1.compute.amazonaws.com:3001"

Write-Host "Environment variables set successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Building and deploying to GitHub Pages..." -ForegroundColor Cyan

npm run deploy

Write-Host ""
Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Visit: https://rushik8626.github.io/Chat-Messaging-App" -ForegroundColor Yellow
