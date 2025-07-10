#!/bin/bash

echo "🚀 Deploying Fund Tracker Application..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    print_status "All dependencies are installed."
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install server dependencies
    cd server
    npm install
    cd ..
    
    # Install client dependencies
    cd client
    npm install
    cd ..
    
    print_status "Dependencies installed successfully."
}

# Build the client
build_client() {
    print_status "Building client application..."
    
    cd client
    npm run build
    
    if [ $? -eq 0 ]; then
        print_status "Client built successfully."
    else
        print_error "Client build failed."
        exit 1
    fi
    
    cd ..
}

# Test the build
test_build() {
    print_status "Testing the build..."
    
    # Test server start
    cd server
    timeout 10s npm start &
    SERVER_PID=$!
    
    sleep 5
    
    # Test if server is running
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        print_status "Server is running correctly."
    else
        print_warning "Server health check failed. This might be normal if MongoDB is not running locally."
    fi
    
    # Kill the server
    kill $SERVER_PID 2>/dev/null
    cd ..
}

# Pre-deploy checklist
pre_deploy_checklist() {
    print_status "Running pre-deploy checklist..."
    
    # Check for environment files
    if [ ! -f "server/.env.example" ]; then
        print_warning "server/.env.example not found. Creating one..."
        cat > server/.env.example << EOF
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/fund-tracker?retryWrites=true&w=majority
PORT=5000
NODE_ENV=production
EOF
    fi
    
    if [ ! -f "client/.env.example" ]; then
        print_warning "client/.env.example not found. Creating one..."
        cat > client/.env.example << EOF
REACT_APP_API_URL=https://your-backend-url.onrender.com
EOF
    fi
    
    # Check for _redirects file
    if [ ! -f "client/public/_redirects" ]; then
        print_warning "client/public/_redirects not found. Creating one..."
        echo "/*    /index.html   200" > client/public/_redirects
    fi
    
    print_status "Pre-deploy checklist completed."
}

# Main deployment process
main() {
    print_status "Starting deployment process..."
    
    check_dependencies
    install_dependencies
    pre_deploy_checklist
    build_client
    test_build
    
    print_status "✅ Deployment preparation completed successfully!"
    print_status ""
    print_status "Next steps:"
    print_status "1. Create accounts on MongoDB Atlas, Render, and Netlify"
    print_status "2. Set up MongoDB Atlas database"
    print_status "3. Deploy backend to Render"
    print_status "4. Deploy frontend to Netlify"
    print_status "5. Configure environment variables"
    print_status ""
    print_status "For detailed instructions, check DEPLOY_GUIDE.md"
}

# Run the main function
main
