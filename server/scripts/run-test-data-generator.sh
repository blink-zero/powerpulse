#!/bin/bash

# Change to the server directory
cd "$(dirname "$0")/.."

# Run the test data generator
echo "Running battery history test data generator..."
node scripts/add-test-battery-history.js

echo "Done!"
