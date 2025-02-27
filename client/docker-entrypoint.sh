#!/bin/bash
set -e

# Generate nginx config from template with environment variables
envsubst '${ENABLE_HTTPS} ${SERVER_HOST} ${SERVER_PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Create self-signed SSL certificate if HTTPS is enabled and certificates don't exist
if [ "$ENABLE_HTTPS" = "true" ] && [ ! -f /etc/nginx/ssl/cert.pem ]; then
  echo "HTTPS is enabled but no certificates found. Generating self-signed certificates..."
  
  # Create directory for SSL certificates if it doesn't exist
  mkdir -p /etc/nginx/ssl
  
  # Generate self-signed certificate
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/key.pem \
    -out /etc/nginx/ssl/cert.pem \
    -subj "/C=US/ST=State/L=City/O=PowerPulse/CN=localhost"
    
  echo "Self-signed certificates generated."
fi

# Check if certificates exist when HTTPS is enabled
if [ "$ENABLE_HTTPS" = "true" ]; then
  if [ ! -f /etc/nginx/ssl/cert.pem ] || [ ! -f /etc/nginx/ssl/key.pem ]; then
    echo "ERROR: HTTPS is enabled but certificates are missing."
    echo "Please provide valid SSL certificates or disable HTTPS."
    exit 1
  fi
  
  echo "HTTPS is enabled and certificates are present."
fi

# Execute the CMD
exec "$@"
