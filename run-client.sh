#!/bin/bash

# Run the PowerPulse client for testing

echo "Starting PowerPulse client..."

# Navigate to the client directory
cd "$(dirname "$0")/client"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "Installing client dependencies..."
  npm install
fi

# Start the client
echo "Starting client on port 3000..."
npm run dev
