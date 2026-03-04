#!/bin/bash

# STEAM Project "Inti Rupa" Setup Script
# This script sets up the development environment for the STEAM project

set -e  # Exit on error

echo "🚀 Starting STEAM Project Setup..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if .env file exists
echo "📝 Checking environment configuration..."
if [ ! -f .env ]; then
    print_warning ".env file not found. Copying from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        print_success ".env file created from .env.example"
        print_warning "Please update .env file with your actual configuration!"
    else
        print_error ".env.example not found!"
        exit 1
    fi
else
    print_success ".env file exists"
fi

echo ""

# Setup Backend
echo "🐍 Setting up Backend (FastAPI)..."
cd backend

# Check if Python is installed
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    print_error "Python is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Determine Python command
if command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
else
    PYTHON_CMD=python
fi

print_success "Python found: $($PYTHON_CMD --version)"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_warning "Creating Python virtual environment..."
    $PYTHON_CMD -m venv venv
    print_success "Virtual environment created"
else
    print_success "Virtual environment already exists"
fi

# Activate virtual environment
print_warning "Activating virtual environment..."
source venv/bin/activate || source venv/Scripts/activate

# Install requirements if requirements.txt exists
if [ -f "requirements.txt" ]; then
    print_warning "Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    print_success "Python dependencies installed"
else
    print_warning "requirements.txt not found in backend directory"
fi

cd ..
echo ""

# Setup Frontend
echo "⚛️  Setting up Frontend (React + Vite)..."
cd frontend

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 20.19+ or 22.12+"
    exit 1
fi

NODE_VERSION=$(node --version)
print_success "Node.js found: $NODE_VERSION"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

NPM_VERSION=$(npm --version)
print_success "npm found: v$NPM_VERSION"

# Install dependencies if package.json exists
if [ -f "package.json" ]; then
    print_warning "Installing Node.js dependencies..."
    npm install
    print_success "Node.js dependencies installed"
else
    print_warning "package.json not found in frontend directory"
fi

cd ..
echo ""

# Check Docker
echo "🐳 Checking Docker..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker found: $DOCKER_VERSION"
else
    print_warning "Docker is not installed. Docker is optional but recommended."
fi

echo ""
echo "✅ Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Update .env file with your configuration"
echo "   2. Make sure PostgreSQL is running"
echo "   3. Start Backend: cd backend && source venv/bin/activate && uvicorn main:app --reload"
echo "   4. Start Frontend: cd frontend && npm run dev"
echo ""
echo "🎉 Happy Coding!"
