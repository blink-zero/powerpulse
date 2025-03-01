#!/bin/bash

# Change to the server directory
cd "$(dirname "$0")/.."

# Check if the data directory exists
if [ ! -d "data" ]; then
  echo "Creating data directory..."
  mkdir -p data
fi

# Run the migration script
echo "Running settings migration..."
node scripts/apply-settings-migration.js

# Check if the migration was successful
if [ $? -eq 0 ]; then
  echo "Settings migration completed successfully!"
else
  echo "Settings migration failed!"
  exit 1
fi

# Make the script executable
chmod +x scripts/run-settings-migration.sh

echo "Done!"
