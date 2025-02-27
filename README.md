# PowerPulse - Modern UPS Monitoring Dashboard

PowerPulse is a modern UPS monitoring dashboard integrated with Network UPS Tools (NUT). It provides a clean, responsive interface for monitoring and managing UPS systems.

## Code Quality Improvements

The codebase has been enhanced with several code quality and maintainability improvements:

### Recent Improvements (v1.6.0)

#### 1. Consolidated UPS Monitoring System
- Combined functionality from separate monitoring modules into a single cohesive service
- Improved reliability with both real-time monitoring and polling-based fallback
- Enhanced error handling and recovery mechanisms
- Better logging for troubleshooting
- Optimized database operations for status tracking

#### 2. Improved Notification System Architecture
- Refactored notification components into smaller, more focused components:
  - `DiscordNotificationSettings`: Handles Discord webhook configuration and testing
  - `SlackNotificationSettings`: Handles Slack webhook configuration and testing
  - `EmailNotificationSettings`: Handles email notification configuration and testing
  - `NotificationTypes`: Manages different notification types (battery, low battery)
  - `NotificationHistory`: Displays history of sent notifications
- Enhanced user experience with better feedback during notification testing
- Improved code organization and maintainability

#### 3. Enhanced Settings Page UI
- Implemented tab-based interface to reduce visual clutter:
  - General settings tab for application-wide settings
  - Notifications tab for all notification-related settings
  - Account tab for user account settings
  - User Management tab for admin users
- Added collapsible sections for notification channels
- Improved organization of settings into logical categories
- Better user experience with focused, task-oriented views

### Previous Improvements (v1.5.1)

#### 1. Extended Notification System
- Support for multiple notification channels:
  - Discord webhook integration for UPS status notifications
  - Slack webhook integration for UPS status notifications
  - Email notifications with configurable recipients
- Notification history UI to view past notifications
- Improved code organization:
  - Extracted notification logic into a custom hook for better reusability
  - Modularized SettingsPage into smaller components for better maintainability
- Enhanced Docker configuration:
  - Multi-stage builds for server Dockerfile to reduce image size
  - Environment variable validation in Docker entrypoint script
  - SMTP configuration options for email notifications

### Previous Improvements (v1.3.0)

#### 1. Discord Webhook Notifications
- Added Discord webhook integration for UPS status notifications
- Configurable notification settings in the Settings page
- Discord notifications when UPS goes on battery power
- Discord notifications for low battery conditions
- Discord notifications when UPS returns to online status
- Test notification functionality
- Automatic status monitoring with configurable polling interval
- Server-side notification handling with rich Discord embeds
- Notification logs for tracking status changes

### Previous Improvements (v1.2.0)

#### 1. Server Entry Point Standardization
- Updated root package.json "start" script to point to the new server.js entry point
- Added compatibility layer in server/fixed_index.js to handle references to the old entry point

#### 2. Enhanced Security
- Improved JWT secret handling with proper validation and fallbacks
- Added comprehensive environment variable validation
- Added HTTPS configuration documentation
- Added security headers to nginx configuration
- Added support for HTTPS in Docker setup

#### 3. Improved Error Handling
- Enhanced NUT client with retry logic, timeouts, and better error reporting
- Added more specific error types and messages
- Improved error handling in authentication middleware

#### 4. Better Environment Configuration
- Enhanced .env.example files with better documentation and examples
- Added validation for required environment variables
- Added more configuration options for advanced use cases
- Added environment variable support in Docker containers

#### 5. Testing Setup
- Added test-setup.js with Jest and React Testing Library configuration
- Added mocks for common dependencies like localStorage, fetch, and NUT client
- Added console output suppression for cleaner test output

#### 6. Dependency Management
- Moved client-specific dependencies from root package.json to client/package.json
- Updated axios to the latest version

#### 7. Docker Improvements
- Updated Docker configuration to use the new server.js entry point
- Added health checks for Docker containers
- Simplified Docker configuration for better compatibility
- Improved nginx configuration with security headers
- Enhanced Docker reliability
- Fixed Docker build issues by using npm install instead of npm ci

### Previous Improvements (v1.1.0)

### 1. API Service Layer

A dedicated API service layer has been implemented to centralize API calls and provide a consistent interface for interacting with the backend:

- `client/src/services/api.js`: Base API configuration with Axios
- `client/src/services/authService.js`: Authentication-related API calls
- `client/src/services/nutService.js`: NUT server-related API calls
- `client/src/services/upsService.js`: UPS system-related API calls

This separation of concerns makes the code more maintainable and testable.

### 2. Custom Hooks

Several custom hooks have been created to encapsulate common functionality:

- `useApi`: A hook for making API calls with loading and error states
- `usePollingApi`: A hook for polling API calls at regular intervals
- `useForm`: A hook for form handling with validation

These hooks reduce code duplication and provide a consistent way to handle common tasks.

### 3. Reusable Components

A set of reusable UI components has been created to ensure consistency across the application:

- `Button`: A customizable button component
- `Card`: A card component for displaying content
- `ErrorBoundary`: A component for catching and handling errors
- `FormField`: A standardized form field component
- `Modal`: A modal dialog component
- `Toast`: A toast notification system
- `UpsCard`: A specialized component for displaying UPS system information
- `Navigation`: A set of modular navigation components for consistent layout

The navigation components have been modularized for better maintainability:
- `Sidebar`: Main sidebar component
- `SidebarHeader`: Header section of the sidebar
- `SidebarNavigation`: Navigation menu in the sidebar
- `UserProfile`: User profile section in the sidebar
- `Header`: Top navigation bar
- `Footer`: Footer component

### 4. Error Handling

A comprehensive error handling system has been implemented:

- Global error boundary in `App.jsx`
- Toast notifications for user-facing errors
- Utility functions for formatting and logging errors

### 5. Form Validation

A form validation system has been implemented using the `createValidator` utility and the `useForm` hook.

### 6. Type Definitions

Type definitions have been added using JSDoc comments for better code documentation and IDE support.

## Project Structure

```
powerpulse/
├── client/                 # Frontend code
│   ├── public/             # Static assets
│   └── src/
│       ├── components/     # Reusable UI components
│       │   └── navigation/ # Navigation components
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

1. Clone the repository:
   ```
   git clone https://github.com/blink-zero/powerpulse.git
   cd powerpulse
   ```

2. Install dependencies:
   ```
   npm run install-all
   ```

3. Start the development server:
   ```
   npm run dev
   ```

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

## Usage

See the [client/src/README.md](client/src/README.md) file for detailed documentation on how to use the frontend components and services.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
