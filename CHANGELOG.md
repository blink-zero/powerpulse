# Changelog

All notable changes to the PowerPulse project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2025-02-27

### Added
- Extended notification system to support multiple channels:
  - Added Slack webhook integration for notifications
  - Added email notifications with configurable recipients
  - Added notification history UI to view past notifications
- Improved code organization:
  - Extracted notification logic into a custom hook for better reusability
  - Modularized SettingsPage into smaller components for better maintainability
  - Created useBatteryHistory hook for better battery history management
- Enhanced Docker configuration:
  - Implemented multi-stage builds for server Dockerfile to reduce image size
  - Added environment variable validation in Docker entrypoint script
  - Added SMTP configuration options for email notifications
- Automatic battery history recording:
  - Added periodic battery history recording for all UPS systems
  - Implemented data cleanup to prevent database bloat
  - Added graceful server shutdown handling

### Fixed
- Fixed battery history graph not displaying correctly
- Fixed API endpoint mismatch in battery history fetching
- Improved error handling in battery history components

### Changed
- Updated server-side notification handling to support multiple notification channels
- Improved database schema with new columns for additional notification settings
- Enhanced environment variable documentation in .env.example files

## [1.3.0] - 2025-02-27

### Added
- Added Discord webhook notifications system:
  - Configurable notification settings in the Settings page
  - Discord notifications when UPS goes on battery power
  - Discord notifications for low battery conditions
  - Discord notifications when UPS returns to online status
  - Test notification functionality
  - Automatic status monitoring with configurable polling interval
  - Server-side notification handling with Discord webhook integration
  - Notification logs for tracking status changes

### Fixed
- Fixed Docker container health check issues:
  - Improved client Dockerfile with proper health check configuration
  - Added health check endpoint to nginx configuration
  - Updated docker-compose.yml with proper environment variables
  - Enhanced Docker entrypoint script handling
  - Fixed server Dockerfile with proper health check configuration
  - Added wget to server container for health checks
  - Increased health check start period for more reliable container startup
  - Fixed health check command syntax in docker-compose.yml
  - Standardized health check commands across all Docker configurations
  - Used proper shell command format for health checks
- Added missing axios dependency to server package.json for Discord webhook functionality
- Created server/.env file with secure JWT_SECRET for development
- Fixed Docker entrypoint script issue with missing nginx template

## [1.2.0] - 2025-02-27

### Fixed
- Updated root package.json "start" script to point to the new server.js entry point
- Added compatibility layer in server/fixed_index.js to handle references to the old entry point
- Improved error handling in NUT client utilities
- Enhanced security by moving hardcoded JWT_SECRET to environment variables
- Moved client-specific dependencies from root package.json to client/package.json
- Fixed Docker configuration to use the new server.js entry point
- Simplified Docker configuration for better compatibility
- Fixed Docker build issues by using npm install instead of npm ci

### Added
- Added more comprehensive environment variable validation
- Added HTTPS configuration documentation
- Added testing setup and documentation
- Added more examples to the documentation
- Added health checks for Docker containers

### Improved
- Enhanced Docker configuration with better reliability
- Improved nginx configuration with security headers

## [1.1.0] - 2025-02-27

### Added
- New navigation components in `client/src/components/navigation/`:
  - `Sidebar.jsx`: Main sidebar container component
  - `SidebarHeader.jsx`: Logo and title section of the sidebar
  - `SidebarNavigation.jsx`: Navigation menu items component
  - `UserProfile.jsx`: User profile section in the sidebar
  - `Header.jsx`: Top navigation bar component
  - `Footer.jsx`: Application footer component
  - `NavItem.jsx`: Reusable navigation item component
  - `navigationConstants.js`: Constants for navigation items
  - `index.js`: Barrel file for easier imports
  - `README.md`: Documentation for navigation components
- Server-side modular architecture:
  - `server/db/index.js`: Database setup and initialization
  - `server/middleware/auth.js`: Authentication middleware
  - `server/utils/nutClient.js`: NUT client utilities
  - `server/routes/auth.js`: Authentication routes
  - `server/routes/nutServers.js`: NUT server routes
  - `server/routes/upsSystems.js`: UPS systems routes
  - `server/routes/users.js`: User management routes
  - `server/app.js`: Express app setup and configuration
  - `server/server.js`: Entry point that starts the server
  - `server/README.md`: Documentation for server architecture
- Improved documentation:
  - Updated main `README.md` with new project structure
  - Updated `client/src/README.md` with navigation components information

### Changed
- Refactored `Layout.jsx` to use the new modular navigation components
- Improved navigation system by using React Router's NavLink for better active state handling
- Updated server's `package.json` to use the new entry point (`server.js` instead of `index.js`)
- Modularized monolithic `server/index.js` into separate modules

### Improved
- Better code organization with separation of concerns
- Enhanced maintainability through modular architecture
- Improved reusability of components
- Better documentation for future developers
- Easier extension of the application with new features
- More consistent navigation experience
- Responsive design improvements in navigation components

### Technical Details
- Client-side changes:
  - Extracted sidebar, header, footer, and navigation components from Layout.jsx
  - Created a constants file for navigation items
  - Used React Router's NavLink for better active state handling
  - Added barrel exports for easier imports
  - Added comprehensive documentation for navigation components

- Server-side changes:
  - Split monolithic index.js into logical modules
  - Organized routes by resource type
  - Separated database setup from application logic
  - Extracted authentication middleware
  - Isolated NUT client utilities
  - Created a proper Express app setup
  - Updated entry point and package.json
