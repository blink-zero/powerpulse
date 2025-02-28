# Docker Setup for PowerPulse

This document provides detailed instructions for setting up and configuring PowerPulse using Docker.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [Timezone Configuration](#timezone-configuration)
  - [HTTPS Configuration](#https-configuration)
  - [NUT Server Configuration](#nut-server-configuration)
  - [Email Configuration](#email-configuration)
- [Persistent Data](#persistent-data)
- [Docker Compose Reference](#docker-compose-reference)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Docker Engine (version 19.03.0+)
- Docker Compose (version 1.27.0+)
- Git (for cloning the repository)

## Quick Start

### Using Local Build

1. Clone the repository:
   ```bash
   git clone https://github.com/blink-zero/powerpulse.git
   cd powerpulse
   ```

2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file to set your configuration:
   ```bash
   # Generate a secure JWT secret
   JWT_SECRET=$(openssl rand -hex 32)
   # Replace the default value in .env
   sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
   
   # Edit other settings as needed
   nano .env
   ```

4. Start the containers:
   ```bash
   docker-compose up -d
   ```

5. Access PowerPulse at http://localhost

### Using Docker Hub Images

You can also run PowerPulse directly from Docker Hub without cloning the repository:

1. Create a directory for PowerPulse:
   ```bash
   mkdir powerpulse
   cd powerpulse
   ```

2. Create a data directory for the server:
   ```bash
   mkdir -p server/data
   ```

3. Download the Docker Compose file:
   ```bash
   wget https://raw.githubusercontent.com/blink-zero/powerpulse/v1.8.2/docker-compose.dockerhub.yml -O docker-compose.yml
   ```

4. Create an environment file:
   ```bash
   wget https://raw.githubusercontent.com/blink-zero/powerpulse/v1.8.2/.env.example -O .env
   ```

5. Edit the `.env` file to set your configuration:
   ```bash
   # Generate a secure JWT secret
   JWT_SECRET=$(openssl rand -hex 32)
   # Replace the default value in .env
   sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
   
   # Edit other settings as needed
   nano .env
   ```

6. Start the containers:
   ```bash
   docker-compose up -d
   ```

7. Access PowerPulse at http://localhost

## Configuration

### Environment Variables

PowerPulse uses environment variables for configuration. These can be set in the `.env` file or passed directly to `docker-compose`.

#### Why .env is Used

The `.env` file is automatically read by Docker Compose and provides a convenient way to:

- Keep sensitive information like passwords and API keys out of your docker-compose.yml
- Easily switch between different configurations
- Maintain consistent settings across container restarts
- Share non-sensitive configuration examples with others

#### Required Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT token generation | None (must be set) |
| `PORT` | Server port | 5000 |

#### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TZ` | Timezone for containers | UTC |
| `DEFAULT_NUT_HOST` | NUT server hostname | host.docker.internal |
| `DEFAULT_NUT_PORT` | NUT server port | 3493 |
| `DEFAULT_NUT_USERNAME` | NUT server username | None |
| `DEFAULT_NUT_PASSWORD` | NUT server password | None |
| `ENABLE_HTTPS` | Enable HTTPS for the client | false |
| `LOG_LEVEL` | Server logging level | info |

### Timezone Configuration

By default, Docker containers use UTC time. To set your local timezone:

1. Add the `TZ` environment variable to your `.env` file:
   ```
   TZ=America/New_York
   ```

2. Common timezone values:
   - `America/New_York` (Eastern Time)
   - `America/Chicago` (Central Time)
   - `America/Denver` (Mountain Time)
   - `America/Los_Angeles` (Pacific Time)
   - `Europe/London` (GMT/BST)
   - `Europe/Paris` (Central European Time)
   - `Asia/Tokyo` (Japan Standard Time)
   - `Australia/Sydney` (Australian Eastern Time)

The full list of timezone names can be found [here](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones).

### HTTPS Configuration

To enable HTTPS:

1. Set `ENABLE_HTTPS=true` in your `.env` file

2. For production use, mount your SSL certificates:
   ```yaml
   volumes:
     - /path/to/your/cert.pem:/etc/nginx/ssl/cert.pem
     - /path/to/your/key.pem:/etc/nginx/ssl/key.pem
   ```

3. For testing, the container will generate self-signed certificates automatically

### NUT Server Configuration

PowerPulse needs to connect to a Network UPS Tools (NUT) server:

1. If NUT is running on your host machine:
   ```
   DEFAULT_NUT_HOST=host.docker.internal
   DEFAULT_NUT_PORT=3493
   ```

2. If NUT is running on another server:
   ```
   DEFAULT_NUT_HOST=192.168.1.100
   DEFAULT_NUT_PORT=3493
   ```

3. If NUT requires authentication:
   ```
   DEFAULT_NUT_USERNAME=upsuser
   DEFAULT_NUT_PASSWORD=secret
   ```

### Email Configuration

To enable email notifications:

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
SMTP_FROM=powerpulse@example.com
```

## Persistent Data

PowerPulse stores its database and configuration in a Docker volume. This ensures your data persists across container restarts and updates.

The data is stored in:
- Container path: `/app/data`
- Host path (bind mount): `./server/data`

To back up your data:
```bash
cp -r ./server/data /path/to/backup
```

## Docker Compose Reference

The `docker-compose.yml` file defines two services:

1. **server**: Node.js backend API
   - Exposes port 5001 (mapped to internal port 5000)
   - Stores data in a persistent volume
   - Handles database operations and NUT communication

2. **client**: Nginx web server for the frontend
   - Exposes port 80
   - Serves the React application
   - Proxies API requests to the server container

## Troubleshooting

### Common Issues

1. **Container fails to start**
   - Check logs: `docker-compose logs server` or `docker-compose logs client`
   - Verify environment variables are set correctly
   - Ensure ports are not already in use

2. **Cannot connect to NUT server**
   - If using `host.docker.internal`, ensure NUT is running on the host
   - Check NUT server logs for connection attempts
   - Verify firewall settings allow connections on the NUT port

3. **Database errors**
   - Check permissions on the data directory
   - Verify the server container has write access to the volume

4. **"JWT_SECRET not set" error**
   - Ensure you've set a secure JWT_SECRET in your .env file
   - The default value in .env.example should not be used in production

For more help, check the [GitHub issues](https://github.com/blink-zero/powerpulse/issues) or create a new issue.
