#!/bin/bash

# Run the PowerPulse server for testing

echo "Starting PowerPulse server..."

# Navigate to the server directory
cd "$(dirname "$0")/server"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "Installing server dependencies..."
  npm install
fi

# Start the server
echo "Starting server on port 5000..."
node index.js
