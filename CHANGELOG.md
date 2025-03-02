# Changelog

All notable changes to the PowerPulse project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.9.1] - 2025-03-01

### Added
- Documented previously undocumented API endpoints:
  - Added User Settings API documentation
  - Added Debug API documentation with all available debug endpoints
  - Updated API.md table of contents to include new sections
  - Provided detailed request/response examples for all endpoints

### Fixed
- Fixed battery history time filter issues:
  - Changed time filter options from 7 days to 3 days for better data representation
  - Improved client-side filtering to ensure only data within the requested time range is displayed
  - Added data sampling for multi-day views to get a more representative sample across the full time range
  - Increased record limit for multi-day views to provide better data coverage
  - Enhanced logging for better troubleshooting of time filter issues
- Fixed notification history timestamps to match the timezone shown on the dashboard:
  - Updated date formatting in NotificationHistory component to use consistent formatting options
  - Ensured consistent date display format across the application

### Improved
- Simplified battery history implementation:
  - Streamlined data fetching and processing in useBatteryHistory hook
  - Reduced complexity in batteryHistoryService by using a single reliable endpoint
  - Simplified chart configuration in Dashboard component
  - Removed excessive logging and error handling
  - Improved code readability and maintainability

## [1.9.0] - 2025-03-01

### Changed
- Consolidated settings tables:
  - Merged notification settings into the user_settings table
  - Created a view for backward compatibility
  - Improved settings management with a unified approach
  - Enhanced data consistency and reduced database complexity
  - Simplified API endpoints for settings management
- Enhanced notification system:
  - Improved settings loading and saving
  - Added better error handling and validation
  - Enhanced settings synchronization between client and server
  - Added detailed logging for troubleshooting
  - Improved verification of saved settings

### Added
- New migration system for settings consolidation:
  - Added SQL migration script for consolidating tables
  - Created JavaScript migration utility for data transfer
  - Added shell script for easy migration execution
  - Implemented backward compatibility layer
- New userSettings API endpoint:
  - Added comprehensive validation for all settings
  - Improved error handling and reporting
  - Enhanced security with proper input validation
  - Added detailed logging for troubleshooting

### Technical
- Improved code organization:
  - Created dedicated userSettingsService for client-side settings management
  - Enhanced SettingsContext with better state management
  - Added SettingsLoader component for improved UX during settings loading
  - Implemented proper settings synchronization between components

## [1.8.3] - 2025-03-01

### Added
- Comprehensive upgrade documentation:
  - Added detailed upgrade instructions for all installation methods
  - Added database backup and restore procedures
  - Added troubleshooting steps for common upgrade issues
  - Added guidance on checking for updates
- Application Information section in Settings:
  - Added new "About" tab in the Settings page
  - Created ApplicationInfo component to display application details
  - Included version, repository link, license, and copyright information
  - Integrated with the centralized configuration system
- Status indicators for notification settings:
  - Added visual indicators showing whether Discord webhook is configured
  - Added visual indicators showing whether Slack webhook is configured
  - Added visual indicators showing whether Email notifications are configured
  - Improved user experience with clear configuration status

### Fixed
- Fixed automatic logout not working correctly on mobile devices:
  - Enhanced `useInactivityTimer` hook with additional mobile-specific events
  - Added support for touchmove, touchend, and touchcancel events
  - Implemented special handling for visibility changes to detect background/foreground app transitions
  - Added localStorage-based timestamp tracking for more reliable inactivity detection
  - Improved logging for better debugging of activity detection
  - Updated tests to cover new mobile-specific functionality

### Improved
- Enhanced documentation organization:
  - Moved upgrade section to a more logical location after installation
  - Improved README structure for better user experience
  - Added more detailed explanations for upgrade procedures
- Enhanced Settings page organization:
  - Added dedicated tab for application information
  - Improved navigation with clear tab labels and icons
  - Added status badges to notification settings for better visibility

## [1.8.2] - 2025-02-28

### Added
- Centralized configuration system:
  - Added `client/src/config/appConfig.js` to store application-wide configuration values
  - Eliminated version number duplication across components
- Custom React hooks for improved code organization:
  - Added `useInactivityTimer` hook for better session timeout management
  - Added `useFormValidation` hook for form state management and validation
- Centralized API service:
  - Added `client/src/services/api.js` with organized API endpoints
  - Added request/response interceptors for common functionality
  - Improved error handling for API requests
- GitHub Actions CI/CD workflow:
  - Added automated build and testing pipeline
  - Added security vulnerability scanning

### Changed
- Updated components to use centralized configuration:
  - Modified Footer.jsx to use appConfig for version and copyright information
  - Updated SetupPage.jsx to use appConfig for consistent branding
- Improved form validation in AccountSettings:
  - Added real-time validation feedback
  - Enhanced error messages with visual indicators
  - Added loading state during form submission
- Refactored AuthContext to use custom hooks and API service:
  - Improved code organization and readability
  - Reduced code duplication
  - Enhanced error handling

### Security
- Improved session timeout implementation:
  - More reliable activity detection
  - Better cleanup of event listeners
  - Cleaner code organization

## [1.8.1] - 2025-02-28

### Added
- Automatic session timeout feature:
  - Added security feature that logs users out after a period of inactivity
  - Implemented user activity tracking (mouse movements, clicks, keystrokes)
  - Added configurable timeout setting in Account Settings
  - Default timeout set to 30 minutes
  - Added visual feedback when saving timeout settings
- Docker improvements:
  - Added dedicated Docker documentation (DOCKER.md)
  - Added timezone configuration support for Docker containers
  - Improved environment variable handling in docker-compose.yml
  - Added detailed explanations for Docker setup and configuration

### Security
- Enhanced authentication security with automatic logout for inactive sessions
- Improved session management to reduce risk of unauthorized access

### Documentation
- Added comprehensive API documentation (API.md)
  - Detailed all available API endpoints
  - Included request/response examples for each endpoint
  - Added authentication information
- Added comprehensive Docker setup guide
- Added timezone configuration instructions
- Improved environment variable documentation

## [1.8.0] - 2025-02-28

### Added
- UPS Systems nicknaming feature:
  - Added ability to assign custom nicknames to UPS systems
  - Implemented nickname editing UI in the UPS Systems page
  - Added dedicated API endpoint for updating UPS nicknames
  - Improved UPS display to prioritize nicknames in the UI
  - Added database migration for nickname storage

### Technical
- Enhanced database migration system:
  - Improved migration file handling to support multiple migration files
  - Added automatic discovery and execution of all SQL migration files
  - Better error handling and reporting during migrations
  - Maintained backward compatibility with existing migration code

## [1.7.0] - 2025-02-28

### Added
- Extended UPS Systems details view:
  - Added detailed UPS information from NUT server
  - Implemented expandable card interface for each UPS
  - Added comprehensive battery details section
  - Added device information section
  - Added driver details section
  - Added input/output voltage information
  - Added UPS-specific details section
  - Improved visual presentation with organized data tables
  - Enhanced user experience with collapsible sections

### Changed
- Redesigned UPS Systems page:
  - Replaced table view with detailed card layout
  - Improved visual hierarchy with summary and detail sections
  - Enhanced readability with categorized information
  - Added expand/collapse functionality for detailed information
  - Maintained key metrics visibility in the summary view

### Technical
- Enhanced server-side NUT client:
  - Added support for retrieving all available UPS variables
  - Improved data organization with categorized details
  - Added structured data format for better frontend integration
  - Maintained backward compatibility with existing code

## [1.6.0] - 2025-02-27

### Added
- Consolidated UPS monitoring system:
  - Combined functionality from separate monitoring modules into a single cohesive service
  - Improved reliability with both real-time monitoring and polling-based fallback
  - Enhanced error handling and recovery mechanisms
  - Better logging for troubleshooting
  - Optimized database operations for status tracking

### Changed
- Improved notification system architecture:
  - Refactored notification components into smaller, more focused components
  - Created dedicated components for different notification channels (Discord, Slack, Email)
  - Added notification history component for better visibility of past notifications
  - Improved code organization and maintainability
  - Enhanced user experience with better feedback during notification testing
- Enhanced Settings page UI:
  - Implemented tab-based interface to reduce visual clutter
  - Added collapsible sections for notification channels
  - Improved organization of settings into logical categories
  - Better user experience with focused, task-oriented views

### Removed
- Deprecated upsStatusChecker.js in favor of the consolidated monitoring service

## [1.5.1] - 2025-02-27

### Fixed
- Fixed issue where UPS status change notifications were not being sent after system restart:
  - Added database persistence for UPS status tracking using the ups_status table
  - Updated UPS monitoring system to store and retrieve status from the database
  - Improved status change detection by using persistent storage instead of in-memory only
  - Added fallback to in-memory cache when database operations fail
  - Ensured ups_status table is created during database initialization
- Fixed issue where notification settings were not being saved to the server's database:
  - Updated SettingsContext to load notification settings from the server when authenticated
  - Added functionality to save notification settings to the server when they change
  - Added explicit "Save Notification Settings" button to ensure settings are saved to the database
  - Added visual feedback during the save process
  - Ensured notification settings are properly synchronized between client and server
  - Fixed "No users with notifications enabled" issue by properly saving settings to the database
  - Added database migration system to apply pending migrations
  - Fixed missing columns in notification_settings table by applying migrations
  - Added direct column addition to ensure required columns exist in notification_settings table
  - Updated notification_settings table schema to include all required columns by default

## [1.5.0] - 2025-02-27

### Fixed
- Fixed issue where UPS systems were not being added to the database after initial setup:
  - Improved UPS registration process to check for existing entries before attempting to create new ones
  - Added better error handling for database operations during UPS registration
  - Implemented fallback mechanism for when NUT client is not available
  - Added support for handling concurrent registration attempts to prevent duplicate entries
  - Added automatic UPS discovery and registration when adding a new NUT server
  - Added automatic UPS discovery and registration during initial application setup

### Changed
- Enhanced UPS monitoring system:
  - Improved reliability of UPS detection and registration
  - Added more detailed logging for troubleshooting
  - Optimized database queries for better performance
  - Added detailed response data for NUT server operations including discovered UPS systems
- Removed setup-database.sh script:
  - Integrated database directory and file creation into the main application
  - Automatically set secure permissions when the application starts
  - Simplified installation process by removing manual setup step
- Fixed database file location consistency:
  - Ensured database file is always created in the server/data directory
  - Added logging of database paths for easier troubleshooting
  - Fixed issue where database file was created in different locations when running locally vs. in Docker

### Security
- Improved database file permissions:
  - Changed data directory permissions from 777 (rwxrwxrwx) to 750 (rwxr-x---)
  - Changed database file permissions from 666 (rw-rw-rw-) to 640 (rw-r-----)
  - Updated docker-entrypoint.sh script with more secure permissions
  - Integrated permission setting into the database initialization process

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
