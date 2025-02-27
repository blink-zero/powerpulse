# PowerPulse Server Architecture

This document outlines the architecture and code organization of the PowerPulse backend server.

## Code Structure

The backend code is organized into the following directories:

- **db/**: Database setup and configuration
- **middleware/**: Express middleware
- **routes/**: API route handlers
- **utils/**: Utility functions

## Server Setup

The server is built using Express.js and uses SQLite for data storage. The main entry points are:

- **server.js**: The entry point that starts the Express server
- **app.js**: Sets up the Express application, middleware, and routes

## Database

The database is set up in `db/index.js`. It uses SQLite with the following tables:

- **users**: User accounts with authentication information
- **nut_servers**: NUT server configurations
- **ups_systems**: UPS systems monitored by the application
- **battery_history**: Historical battery charge data for UPS systems

## Authentication

Authentication is handled using JWT (JSON Web Tokens). The authentication middleware and routes are in:

- **middleware/auth.js**: JWT verification middleware
- **routes/auth.js**: Authentication routes (login, register, setup)

## API Routes

The API is organized into the following route modules:

### Authentication Routes (`routes/auth.js`)

- `GET /api/auth/check-setup`: Check if initial setup is required
- `POST /api/auth/setup`: Perform initial setup (create admin user and NUT server)
- `POST /api/auth/login`: User login
- `POST /api/auth/register`: Register a new user (admin only)

### NUT Server Routes (`routes/nutServers.js`)

- `GET /api/nut/servers`: Get all NUT servers
- `GET /api/nut/servers/:id`: Get a specific NUT server
- `POST /api/nut/servers`: Add a new NUT server
- `PUT /api/nut/servers/:id`: Update a NUT server
- `DELETE /api/nut/servers/:id`: Delete a NUT server
- `POST /api/nut/servers/:id/test`: Test connection to a NUT server
- `GET /api/nut/config`: Get NUT server configuration (legacy)
- `PUT /api/nut/config`: Update NUT server configuration (legacy)

### UPS System Routes (`routes/upsSystems.js`)

- `GET /api/ups/systems`: Get all UPS systems
- `GET /api/ups/systems/:id`: Get a specific UPS system
- `POST /api/ups/systems`: Add a new UPS system
- `PUT /api/ups/systems/:id`: Update a UPS system
- `DELETE /api/ups/systems/:id`: Delete a UPS system
- `POST /api/ups/systems/:id/battery`: Record battery charge for a UPS system
- `GET /api/ups/systems/:id/battery`: Get battery history for a UPS system

### User Routes (`routes/users.js`)

- `GET /api/users`: Get all users (admin only)
- `GET /api/users/:id`: Get a specific user
- `PUT /api/users/:id`: Update a user
- `DELETE /api/users/:id`: Delete a user

## NUT Client Utilities

The `utils/nutClient.js` module provides utilities for interacting with Network UPS Tools (NUT) servers:

- `getNutClient`: Get a NUT client connection
- `getUpsListFromNutServer`: Get the list of UPS devices from a NUT server
- `getUpsVariables`: Get UPS variables from a NUT server
- `getNutUpsData`: Get UPS data from a NUT server

## Error Handling

The server uses a consistent error handling approach:

- HTTP status codes for different error types
- Detailed error messages in the response
- Console logging for server-side errors

## Authentication and Authorization

- JWT-based authentication
- Role-based authorization (admin vs. regular user)
- Protected routes that require authentication
