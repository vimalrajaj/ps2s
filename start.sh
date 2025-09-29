#!/bin/bash

echo "🚀 Starting University Management System..."

# Create uploads directory if it doesn't exist
echo "📁 Creating uploads directory..."
mkdir -p uploads

# Set proper permissions
echo "🔐 Setting permissions..."
chmod 755 uploads

# Start the application
echo "▶️ Starting application..."
npm start