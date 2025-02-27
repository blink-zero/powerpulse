#!/bin/bash

# PowerPulse - Modern UPS Monitoring Dashboard
# Startup script

echo "Starting PowerPulse..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js to run PowerPulse."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm to run PowerPulse."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ] || [ ! -d "server/node_modules" ] || [ ! -d "client/node_modules" ]; then
    echo "Installing dependencies..."
    npm run install-all
fi

# Start the application in development mode
echo "Starting PowerPulse in development mode..."
npm run dev

# Exit gracefully
exit 0
