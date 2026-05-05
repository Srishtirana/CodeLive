#!/bin/bash

# Collaborative Code Editor Setup Script
echo "🚀 Setting up Collaborative Code Editor..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null && ! command -v docker &> /dev/null; then
    echo "❌ Neither MongoDB nor Docker is installed. Please install one of them."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Setup Backend
echo "📦 Setting up backend..."
cd backend

# Install dependencies
npm install

# Create environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file. Please edit it with your configuration."
fi

# Build TypeScript
npm run build

echo "✅ Backend setup complete"

# Setup Frontend
echo "📦 Setting up frontend..."
cd ../frontend

# Install dependencies
npm install

echo "✅ Frontend setup complete"

# Setup Docker (optional)
if command -v docker &> /dev/null; then
    echo "🐳 Docker detected. You can use docker-compose for easy deployment:"
    echo "   cd docker && docker-compose up -d"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "1. Start MongoDB (or use Docker)"
echo "2. Backend: cd backend && npm run dev"
echo "3. Frontend: cd frontend && npm start"
echo ""
echo "Or use Docker: cd docker && docker-compose up -d"
echo ""
echo "Access the app at: http://localhost:3000"
