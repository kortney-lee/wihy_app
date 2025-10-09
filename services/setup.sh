#!/bin/bash

# vHealth Services Setup Script
# This script helps you set up the vHealth Services API quickly

echo "🚀 Welcome to vHealth Services Setup!"
echo "======================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="16.0.0"

if ! node -e "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION') ? 0 : 1)" 2>/dev/null; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please update to version 16 or higher."
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ npm detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if .env exists, if not create from template
if [ ! -f ".env" ]; then
    echo ""
    echo "🔧 Creating environment configuration..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env from template"
        echo "⚠️  Please edit .env file with your configuration"
    else
        echo "❌ .env.example not found"
    fi
else
    echo "✅ .env file already exists"
fi

# Final instructions
echo ""
echo "🎉 Setup completed successfully!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Start the development server: npm run dev"
echo "3. Or start production server: npm start"
echo ""
echo "API will be available at: http://localhost:5000"
echo "Health check: http://localhost:5000/api/health"
echo ""
echo "📚 For more information, see README.md"
echo "🚀 Happy coding!"