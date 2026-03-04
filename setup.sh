#!/bin/bash

# Inti Rupa Setup Script
# This script sets up the development environment for the Inti Rupa project

set -e  # Exit on error

echo "🚀 Starting Inti Rupa Setup..."
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

# Check if .env file exists in backend
echo "📝 Checking environment configuration..."
if [ ! -f backend/.env ]; then
    print_warning ".env file not found in backend/. Copying from .env.example..."
    if [ -f backend/.env.example ]; then
        cp backend/.env.example backend/.env
        print_success "backend/.env file created from .env.example"
        print_warning "Please update backend/.env file with your PostgreSQL password!"
    else
        print_error "backend/.env.example not found!"
        exit 1
    fi
else
    print_success "backend/.env file exists"
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
    print_error "Node.js is not installed. Please install Node.js 18+ or 20+"
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

# Check PostgreSQL
echo "� Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version)
    print_success "PostgreSQL found: $PSQL_VERSION"
else
    print_warning "PostgreSQL command-line tools not found in PATH."
    print_warning "Please make sure PostgreSQL is installed and running."
fi

echo ""
echo "✅ Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Update backend/.env with your PostgreSQL password"
echo "   2. Create database: psql -U postgres -c 'CREATE DATABASE cloudapp;'"
echo "   3. Start Backend: cd backend && source venv/bin/activate && uvicorn main:app --reload"
echo "   4. Start Frontend: cd frontend && npm run dev"
echo ""
echo "📚 Access:"
echo "   - API: http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo "   - Frontend: http://localhost:5173"
echo ""
echo "🎉 Happy Coding!"
