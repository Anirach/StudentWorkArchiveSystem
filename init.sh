#!/bin/bash

# Student Work Archive System - Development Environment Setup Script
# This script initializes the development environment and starts all services

set -e  # Exit on any error

echo "=================================================="
echo "Student Work Archive System - Development Setup"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed. Please install Node.js 18+${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js 18+ is required. Current version: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}Node.js $(node -v) detected${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}npm $(npm -v) detected${NC}"

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Create necessary directories if they don't exist
echo ""
echo "Creating project directories..."
mkdir -p backend/src/{routes,controllers,models,middleware,utils,config}
mkdir -p backend/data
mkdir -p frontend/src/{components,pages,hooks,utils,context,styles}
mkdir -p frontend/public

# Backend setup
echo ""
echo "Setting up backend..."
cd "$PROJECT_ROOT/backend"

if [ ! -f "package.json" ]; then
    echo "Initializing backend package.json..."
    cat > package.json << 'EOF'
{
  "name": "student-work-archive-backend",
  "version": "1.0.0",
  "description": "Backend for Student Work Archive System",
  "main": "src/index.js",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js",
    "db:init": "node src/db/init.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "better-sqlite3": "^9.2.2",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "express-session": "^1.17.3",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.1",
    "jsonwebtoken": "^9.0.2",
    "cookie-parser": "^1.4.6",
    "googleapis": "^129.0.0",
    "nodemailer": "^6.9.7",
    "uuid": "^9.0.1",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
EOF
fi

echo "Installing backend dependencies..."
npm install --silent

# Frontend setup
echo ""
echo "Setting up frontend..."
cd "$PROJECT_ROOT/frontend"

if [ ! -f "package.json" ]; then
    echo "Initializing frontend with Vite..."
    cat > package.json << 'EOF'
{
  "name": "student-work-archive-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "pdfjs-dist": "^4.0.379",
    "recharts": "^2.10.3",
    "lucide-react": "^0.299.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.0.7",
    "class-variance-authority": "^0.7.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "vite": "^5.0.8"
  }
}
EOF
fi

echo "Installing frontend dependencies..."
npm install --silent

# Create environment template if not exists
cd "$PROJECT_ROOT"
if [ ! -f ".env" ]; then
    echo ""
    echo "Creating .env template..."
    cat > .env << 'EOF'
# Server Configuration
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_PATH=./backend/data/archive.db

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Google Drive API
GOOGLE_SHARED_DRIVE_ID=your_shared_drive_id_here

# Session
SESSION_SECRET=your_session_secret_here_change_in_production

# SMTP (Optional - for email notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EOF
    echo -e "${YELLOW}Created .env file. Please update with your credentials.${NC}"
fi

# Initialize database
echo ""
echo "Initializing database..."
cd "$PROJECT_ROOT/backend"
if [ -f "src/db/init.js" ]; then
    node src/db/init.js
else
    echo -e "${YELLOW}Database initialization script not found. Will be created during development.${NC}"
fi

echo ""
echo "=================================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "=================================================="
echo ""
echo "To start the development servers:"
echo ""
echo "  Backend (Terminal 1):"
echo "    cd backend && npm run dev"
echo "    Server will run on: http://localhost:3000"
echo ""
echo "  Frontend (Terminal 2):"
echo "    cd frontend && npm run dev"
echo "    App will run on: http://localhost:5173"
echo ""
echo "Before running, make sure to:"
echo "  1. Update .env with your Google OAuth credentials"
echo "  2. Configure Google Cloud Project with Drive API enabled"
echo "  3. Set up Google Shared Drive access"
echo ""
echo "=================================================="
