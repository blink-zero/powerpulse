# PowerPulse

![PowerPulse Logo](https://img.shields.io/badge/PowerPulse-UPS%20Monitoring-blue)
![Version](https://img.shields.io/badge/version-1.9.0-green)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

PowerPulse is a modern UPS (Uninterruptible Power Supply) monitoring dashboard integrated with Network UPS Tools (NUT). It provides a clean, responsive interface for monitoring and managing your UPS systems.

![PowerPulse Demo](assets/images/PowerPulse_demo.gif)

## Why Use PowerPulse?

- **Real-time Monitoring**: Keep track of your UPS systems' status, battery levels, and power conditions in real-time
- **Multi-channel Notifications**: Receive alerts via Discord, Slack, or email when your UPS status changes
- **Comprehensive Dashboard**: View detailed information about all your UPS systems in one place
- **Historical Data**: Track battery performance over time with built-in history graphs
- **User-friendly Interface**: Modern, responsive design that works on desktop and mobile devices
- **Secure Access**: Role-based authentication system to control access to your UPS monitoring
- **Easy Setup**: Simple installation process with Docker support

## Features

- **UPS Monitoring Dashboard**: View all your UPS systems in a clean, modern interface
- **UPS System Nicknaming**: Assign custom nicknames to your UPS systems for easier identification
- **Detailed UPS Information**: Access comprehensive details about each UPS system
- **Battery History Tracking**: Monitor battery performance over time
- **Multi-channel Notifications**:
  - Discord webhook integration
  - Slack webhook integration
  - Email notifications
- **User Management**: Admin controls for managing users and permissions
- **Customizable Settings**: Configure polling intervals, notification preferences, and more
- **Automatic Session Timeout**: Security feature that logs users out after a period of inactivity
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark Mode Support**: Easy on the eyes during those late-night monitoring sessions

## Project Structure

```
powerpulse/
├── assets/                 # Static assets
│   └── images/             # Image files including demo GIF
├── client/                 # Frontend code
│   ├── public/             # Static assets
│   └── src/
│       ├── components/     # Reusable UI components
│       │   ├── navigation/ # Navigation components
│       │   ├── notifications/ # Notification components
│       │   └── settings/   # Settings components
│       ├── config/         # Application configuration
│       ├── context/        # React context providers
│       ├── hooks/          # Custom React hooks
│       ├── pages/          # Page components
│       ├── services/       # API service layer
│       ├── types/          # Type definitions
│       └── utils/          # Utility functions
└── server/                 # Backend code
    ├── db/                 # Database setup and configuration
    ├── middleware/         # Express middleware
    ├── routes/             # API routes
    │   ├── auth.js         # Authentication routes
    │   ├── nutServers.js   # NUT server routes
    │   ├── upsSystems.js   # UPS systems routes
    │   └── users.js        # User management routes
    ├── utils/              # Utility functions
    │   └── nutClient.js    # NUT client utilities
    ├── app.js              # Express app setup
    └── server.js           # Server entry point
```

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Network UPS Tools (NUT) server

### Installation

#### Standard Installation

1. Clone the repository:
   ```
   git clone https://github.com/blink-zero/powerpulse.git
   cd powerpulse
   ```

2. Install dependencies:
   ```
   npm run install-all
   ```

3. Configure environment variables:
   ```
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the development server:
   ```
   npm run dev
   ```

#### Docker Installation

1. Clone the repository:
   ```
   git clone https://github.com/blink-zero/powerpulse.git
   cd powerpulse
   ```

2. Configure environment variables:
   ```
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Start with Docker Compose:
   ```
   docker-compose up -d
   ```

#### Docker Hub Installation

You can also run PowerPulse directly from Docker Hub without cloning the repository:

1. Create a directory for PowerPulse:
   ```
   mkdir powerpulse
   cd powerpulse
   ```

2. Create a data directory for the server:
   ```
   mkdir -p server/data
   ```

3. Download the Docker Compose file:
   ```
   wget https://raw.githubusercontent.com/blink-zero/powerpulse/v1.9.0/docker-compose.dockerhub.yml -O docker-compose.yml
   ```

4. Create an environment file:
   ```
   wget https://raw.githubusercontent.com/blink-zero/powerpulse/v1.9.0/.env.example -O .env
   # Edit .env with your configuration
   ```

5. Start with Docker Compose:
   ```
   docker-compose up -d
   ```

### Upgrading

#### Standard Installation Upgrade

1. Pull the latest changes from the repository:
   ```
   cd powerpulse
   git pull
   ```

2. Install any new dependencies:
   ```
   npm run install-all
   ```

3. Check for any new environment variables in `.env.example` and add them to your `.env` file if needed.

4. Restart the application:
   ```
   npm run dev
   ```
   
   For production:
   ```
   npm run build
   npm run prod
   ```

#### Docker Installation Upgrade

1. Pull the latest changes from the repository:
   ```
   cd powerpulse
   git pull
   ```

2. Check for any new environment variables in `.env.example` and add them to your `.env` file if needed.

3. Rebuild and restart the containers:
   ```
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

#### Docker Hub Installation Upgrade

1. Update your docker-compose.yml file to use the latest version:
   ```
   # Edit your docker-compose.yml file and update the image tags
   # From:
   # image: blinkzero/powerpulse-server:1.8.3
   # image: blinkzero/powerpulse-client:1.8.3
   # To:
   # image: blinkzero/powerpulse-server:1.9.0
   # image: blinkzero/powerpulse-client:1.9.0
   ```

   Alternatively, download the latest docker-compose file (replace X.Y.Z with the latest version):
   ```
   wget https://raw.githubusercontent.com/blink-zero/powerpulse/vX.Y.Z/docker-compose.dockerhub.yml -O docker-compose.yml
   ```

2. Check for any new environment variables in the latest `.env.example` and add them to your `.env` file if needed:
   ```
   wget https://raw.githubusercontent.com/blink-zero/powerpulse/vX.Y.Z/.env.example -O .env.example
   # Compare .env.example with your .env file and add any new variables
   ```

3. Pull the latest images and restart the containers:
   ```
   docker-compose down
   docker-compose pull
   docker-compose up -d
   ```

#### Database Considerations During Upgrades

PowerPulse automatically handles database migrations during startup. However, it's always a good practice to back up your database before upgrading:

1. **Backup your database** before upgrading (for all installation methods):
   ```
   # For standard installation
   cp server/data/powerpulse.db server/data/powerpulse.db.backup-$(date +%Y%m%d)
   
   # For Docker installation
   docker cp powerpulse-server:/app/data/powerpulse.db ./powerpulse.db.backup-$(date +%Y%m%d)
   ```

2. If you encounter any issues after upgrading, you can restore your backup:
   ```
   # For standard installation
   cp server/data/powerpulse.db.backup-YYYYMMDD server/data/powerpulse.db
   
   # For Docker installation
   docker cp ./powerpulse.db.backup-YYYYMMDD powerpulse-server:/app/data/powerpulse.db
   docker restart powerpulse-server
   ```

3. The application automatically applies any pending database migrations during startup. Check the server logs for any migration-related messages:
   ```
   # For standard installation
   npm run server
   
   # For Docker installation
   docker logs powerpulse-server
   ```

#### Checking for Updates

To stay informed about new releases and updates:

1. **Check the GitHub repository**: Visit the [PowerPulse GitHub repository](https://github.com/blink-zero/powerpulse) to see the latest releases and version information.

2. **Review the CHANGELOG**: Before upgrading, review the [CHANGELOG.md](CHANGELOG.md) file to understand what changes are included in the new version.

3. **Check your current version**: You can see your current version in the footer of the PowerPulse web interface or by checking the version badge in your README.md file.

4. **Subscribe to releases**: On GitHub, you can click the "Watch" button and select "Custom" and then "Releases" to be notified when new versions are released.

#### Troubleshooting Upgrade Issues

If you encounter issues during or after upgrading, try these troubleshooting steps:

1. **Check server logs for errors**:
   ```
   # For standard installation
   npm run server
   
   # For Docker installation
   docker logs powerpulse-server
   ```

2. **Verify database migrations**:
   - Look for migration-related messages in the server logs
   - If you see errors related to database schema or missing tables, try restoring from backup

3. **Client-side issues**:
   - Clear your browser cache and reload the page
   - Check browser console for JavaScript errors
   - Verify that the client is connecting to the correct server URL

4. **Docker-specific issues**:
   - Ensure volumes are properly mounted
   - Check container health status: `docker ps`
   - Verify network connectivity between containers: `docker network inspect powerpulse-network`

5. **Dependency issues**:
   - For standard installation, try reinstalling dependencies: `npm run install-all`
   - For Docker installation, rebuild images: `docker-compose build --no-cache`

6. **Rollback to previous version**:
   - If all else fails, you can roll back to the previous version
   - For standard installation: `git checkout v1.8.3` (replace with your previous version)
   - For Docker Hub installation: update docker-compose.yml to use the previous version tags

### Testing with Sample Data

To generate test battery history data for development and testing:

1. Make sure your server is running and you have at least one UPS system configured
2. Run the test data generator:
   ```
   cd server
   chmod +x scripts/run-test-data-generator.sh
   ./scripts/run-test-data-generator.sh
   ```

This will generate 24 hours of simulated battery history data for all configured UPS systems, which is useful for testing the battery history graph functionality.

## Documentation

- [Client Documentation](client/src/README.md): Details on frontend components and services
- [Server Documentation](server/README.md): Information about the backend API and architecture
- [API Documentation](API.md): Complete reference for all API endpoints
- [Docker Documentation](DOCKER.md): Detailed instructions for Docker setup and configuration
- [Changelog](CHANGELOG.md): History of changes and version updates

## License

This project is licensed under the MIT License - see the LICENSE file for details.
