# Render.com Deploy Preparation Script for Windows PowerShell

# Colors for output
function Write-Info {
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

# Function to check if a command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

# Check dependencies
function Test-Dependencies {
    Write-Info "Checking dependencies..."
    
    if (-not (Test-Command "node")) {
        Write-Error "Node.js is not installed. Please install Node.js first."
        exit 1
    }
    
    if (-not (Test-Command "npm")) {
        Write-Error "npm is not installed. Please install npm first."
        exit 1
    }
    
    if (-not (Test-Command "git")) {
        Write-Error "Git is not installed. Please install Git first."
        exit 1
    }
    
    Write-Info "All dependencies are installed."
}

# Install dependencies
function Install-Dependencies {
    Write-Info "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install server dependencies
    Set-Location server
    npm install
    Set-Location ..
    
    # Install client dependencies
    Set-Location client
    npm install
    Set-Location ..
    
    Write-Info "Dependencies installed successfully."
}

# Create environment files
function New-EnvironmentFiles {
    Write-Info "Creating environment files..."
    
    # Server .env.example
    $serverEnvContent = @"
# Environment Variables for Production
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/fund-tracker?retryWrites=true&w=majority
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://fund-tracker-frontend.onrender.com

# Development (local) variables
# MONGODB_URI=mongodb://localhost:27017/fund-tracker
# NODE_ENV=development
"@
    
    if (-not (Test-Path "server\.env.example")) {
        $serverEnvContent | Out-File -FilePath "server\.env.example" -Encoding UTF8
        Write-Info "Created server/.env.example"
    }
    
    # Client .env.example
    $clientEnvContent = @"
# Frontend Environment Variables for Render
REACT_APP_API_URL=https://fund-tracker-backend.onrender.com

# Development
# REACT_APP_API_URL=http://localhost:5000
"@
    
    if (-not (Test-Path "client\.env.example")) {
        $clientEnvContent | Out-File -FilePath "client\.env.example" -Encoding UTF8
        Write-Info "Created client/.env.example"
    }
}

# Build client
function Build-Client {
    Write-Info "Building client application..."
    
    Set-Location client
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Info "Client built successfully."
    } else {
        Write-Error "Client build failed."
        Set-Location ..
        exit 1
    }
    
    Set-Location ..
}

# Create deployment checklist
function New-DeploymentChecklist {
    Write-Info "Creating deployment checklist..."
    
    $checklistContent = @"
# 🚀 Render.com Deployment Checklist

## Pre-Deploy Setup
- [ ] MongoDB Atlas cluster created
- [ ] Database user created with read/write permissions
- [ ] IP whitelist set to 0.0.0.0/0 (allow all)
- [ ] Connection string copied
- [ ] GitHub repository created and set to public
- [ ] Code pushed to GitHub

## Backend Deploy (Web Service)
- [ ] Render account created
- [ ] Web Service created with settings:
  - Name: fund-tracker-backend
  - Environment: Node
  - Region: Frankfurt (EU Central)
  - Branch: main
  - Root Directory: server
  - Build Command: npm install
  - Start Command: npm start
- [ ] Environment variables added:
  - MONGODB_URI: [Your MongoDB Atlas connection string]
  - NODE_ENV: production
  - PORT: 5000
- [ ] Service deployed successfully
- [ ] Backend URL noted: https://fund-tracker-backend.onrender.com

## Frontend Deploy (Static Site)
- [ ] Static Site created with settings:
  - Name: fund-tracker-frontend
  - Branch: main
  - Root Directory: client
  - Build Command: npm install && npm run build
  - Publish Directory: build
- [ ] Environment variables added:
  - REACT_APP_API_URL: [Your backend URL]
- [ ] Site deployed successfully
- [ ] Frontend URL noted: https://fund-tracker-frontend.onrender.com

## Post-Deploy Testing
- [ ] Backend health check: GET /api/health
- [ ] Frontend loads successfully
- [ ] Admin login works (admin/admin123)
- [ ] Fund operations work (add/edit/delete)
- [ ] Transaction history works
- [ ] Progress bar displays correctly
- [ ] Mobile responsive design works

## URLs for Reference
Backend: https://fund-tracker-backend.onrender.com
Frontend: https://fund-tracker-frontend.onrender.com
Database: MongoDB Atlas

## Common Issues
1. Build failures: Check Node.js version in engines
2. CORS errors: Update CORS origins in server.js
3. API connection: Verify environment variables
4. Database connection: Check MongoDB Atlas settings
"@
    
    $checklistContent | Out-File -FilePath "RENDER_DEPLOYMENT_CHECKLIST.md" -Encoding UTF8
    Write-Info "Created RENDER_DEPLOYMENT_CHECKLIST.md"
}

# Test server start
function Test-ServerStart {
    Write-Info "Testing server start..."
    
    Set-Location server
    
    # Start server in background for testing
    $job = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        npm start
    }
    
    Start-Sleep -Seconds 5
    
    # Test health endpoint
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -TimeoutSec 5
        Write-Info "Server health check passed: $response"
    }
    catch {
        Write-Warning "Server health check failed. This is normal if MongoDB is not running locally."
    }
    finally {
        # Stop the test server
        Stop-Job $job -ErrorAction SilentlyContinue
        Remove-Job $job -ErrorAction SilentlyContinue
        Set-Location ..
    }
}

# Git repository initialization
function Initialize-GitRepository {
    Write-Info "Initializing Git repository..."
    
    if (-not (Test-Path ".git")) {
        git init
        Write-Info "Git repository initialized."
    } else {
        Write-Info "Git repository already exists."
    }
    
    # Create .gitignore if it doesn't exist
    if (-not (Test-Path ".gitignore")) {
        $gitignoreContent = @"
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
build/
dist/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
"@
        $gitignoreContent | Out-File -FilePath ".gitignore" -Encoding UTF8
        Write-Info "Created .gitignore file."
    }
}

# Main function
function Main {
    Write-Info "🚀 Starting Render.com deployment preparation..."
    Write-Info "Current directory: $(Get-Location)"
    
    try {
        Test-Dependencies
        Install-Dependencies
        New-EnvironmentFiles
        Build-Client
        Test-ServerStart
        Initialize-GitRepository
        New-DeploymentChecklist
        
        Write-Info "✅ Deployment preparation completed successfully!"
        Write-Info ""
        Write-Info "Next steps:"
        Write-Info "1. Create MongoDB Atlas database and get connection string"
        Write-Info "2. Create GitHub repository and push your code:"
        Write-Info "   git add ."
        Write-Info "   git commit -m 'Deploy ready version'"
        Write-Info "   git remote add origin https://github.com/USERNAME/REPO-NAME.git"
        Write-Info "   git push -u origin main"
        Write-Info "3. Follow RENDER_DEPLOY_GUIDE.md for detailed instructions"
        Write-Info "4. Use RENDER_DEPLOYMENT_CHECKLIST.md to track progress"
        Write-Info ""
        Write-Warning "Important: Make sure to update CORS origins in server/server.js with your actual Render URLs!"
    }
    catch {
        Write-Error "An error occurred: $_"
        exit 1
    }
}

# Run main function
Main
