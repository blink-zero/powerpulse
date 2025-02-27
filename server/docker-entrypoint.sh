#!/bin/sh
set -e

# Function to check if a required environment variable is set
check_required_env() {
  var_name=$1
  var_value=$(eval echo \$$var_name)
  
  if [ -z "$var_value" ]; then
    echo "ERROR: Required environment variable '$var_name' is not set."
    exit 1
  else
    echo "✓ Environment variable '$var_name' is set."
  fi
}

# Function to check if an optional environment variable is set
check_optional_env() {
  var_name=$1
  default_value=$2
  var_value=$(eval echo \$$var_name)
  
  if [ -z "$var_value" ]; then
    echo "ℹ Optional environment variable '$var_name' is not set. Using default: '$default_value'."
    export $var_name="$default_value"
  else
    echo "✓ Environment variable '$var_name' is set."
  fi
}

echo "PowerPulse Server - Environment Variable Validation"
echo "=================================================="

# Check required environment variables
check_required_env "PORT"
check_required_env "JWT_SECRET"

# Check optional environment variables with defaults
check_optional_env "NODE_ENV" "production"
check_optional_env "DEFAULT_NUT_HOST" "host.docker.internal"
check_optional_env "DEFAULT_NUT_PORT" "3493"
check_optional_env "NUT_CONNECTION_TIMEOUT" "5000"
check_optional_env "NUT_RETRY_ATTEMPTS" "3"
check_optional_env "NUT_RETRY_DELAY" "1000"
check_optional_env "LOG_LEVEL" "info"

# Validate JWT_SECRET
if [ "$JWT_SECRET" = "change_this_to_a_secure_random_string" ] || [ "$JWT_SECRET" = "your-secret-key-here" ]; then
  echo "WARNING: You are using the default JWT_SECRET. This is insecure for production use."
  echo "         Please set a secure random string for JWT_SECRET."
fi

# Validate PORT is a number
if ! [ "$PORT" -eq "$PORT" ] 2>/dev/null; then
  echo "ERROR: PORT must be a number."
  exit 1
fi

echo "Environment validation completed successfully."
echo "=================================================="

# Ensure data directory exists and has correct permissions
echo "Setting up database directory and permissions..."
mkdir -p /app/data
chmod 750 /app/data

# Check if database file exists, create it if it doesn't
if [ -f "/app/data/database.sqlite" ]; then
  echo "Database file exists, setting permissions..."
  chmod 640 /app/data/database.sqlite
else
  echo "Database file does not exist, creating it..."
  touch /app/data/database.sqlite
  chmod 640 /app/data/database.sqlite
fi

echo "Database setup completed."
echo "=================================================="

# Execute the CMD
exec "$@"
