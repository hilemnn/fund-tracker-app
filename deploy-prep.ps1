# Fund Tracker Deployment Preparation Script for Windows
# Run this in PowerShell as Administrator

Write-Host "🚀 Preparing Fund Tracker Application for Deployment..." -ForegroundColor Green

# Function to print colored output
function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check dependencies
Write-Status "Checking dependencies..."

try {
    $nodeVersion = node --version
    Write-Status "Node.js version: $nodeVersion"
} catch {
    Write-Error "Node.js is not installed. Please install Node.js first."
    exit 1
}

try {
    $npmVersion = npm --version
    Write-Status "npm version: $npmVersion"
} catch {
    Write-Error "npm is not installed. Please install npm first."
    exit 1
}

try {
    $gitVersion = git --version
    Write-Status "Git version: $gitVersion"
} catch {
    Write-Error "Git is not installed. Please install Git first."
    exit 1
}

# Install dependencies
Write-Status "Installing dependencies..."

# Root dependencies
npm install

# Server dependencies
Set-Location server
npm install
Set-Location ..

# Client dependencies
Set-Location client
npm install
Set-Location ..

Write-Status "Dependencies installed successfully."

# Build client
Write-Status "Building client application..."
Set-Location client
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Status "Client built successfully."
} else {
    Write-Error "Client build failed."
    exit 1
}

Set-Location ..

# Create environment files if they don't exist
if (!(Test-Path "server\.env.example")) {
    Write-Warning "Creating server\.env.example..."
    @"
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/fund-tracker?retryWrites=true&w=majority
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-app-name.netlify.app
"@ | Out-File -FilePath "server\.env.example" -Encoding UTF8
}

if (!(Test-Path "client\.env.example")) {
    Write-Warning "Creating client\.env.example..."
    @"
REACT_APP_API_URL=https://your-backend-url.onrender.com
"@ | Out-File -FilePath "client\.env.example" -Encoding UTF8
}

if (!(Test-Path "client\public\_redirects")) {
    Write-Warning "Creating client\public\_redirects..."
    "/*    /index.html   200" | Out-File -FilePath "client\public\_redirects" -Encoding UTF8
}

Write-Status "✅ Deployment preparation completed successfully!"
Write-Status ""
Write-Status "Next steps:"
Write-Status "1. Create accounts on MongoDB Atlas, Render, and Netlify"
Write-Status "2. Follow the DEPLOY_GUIDE.md for detailed instructions"
Write-Status "3. Set up your environment variables"
Write-Status "4. Deploy backend to Render"
Write-Status "5. Deploy frontend to Netlify"
Write-Status ""
Write-Status "For detailed instructions, check DEPLOY_GUIDE.md"
