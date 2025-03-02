# PowerPulse API Documentation

This document provides detailed information about the PowerPulse API endpoints.

## Table of Contents

- [Authentication](#authentication)
- [Auth API](#auth-api)
- [Users API](#users-api)
- [NUT Servers API](#nut-servers-api)
- [UPS Systems API](#ups-systems-api)
- [Notifications API](#notifications-api)
- [User Settings API](#user-settings-api)
- [Debug API](#debug-api)
- [System API](#system-api)

## Authentication

PowerPulse uses JSON Web Tokens (JWT) for authentication. Most API endpoints require a valid JWT token to be included in the request header.

### Token Format

Include the token in the Authorization header using the Bearer scheme:

```
Authorization: Bearer <your_jwt_token>
```

### Token Expiration

Tokens expire after 24 hours. After expiration, you'll need to log in again to get a new token.

## Auth API

Endpoints for authentication and user management.

### Check Setup Status

```
GET /api/auth/check-setup
```

Checks if the application needs initial setup.

**Response:**
```json
{
  "isFirstTimeSetup": true|false
}
```

## User Settings API

Endpoints for managing user settings.

### Get User Settings

```
GET /api/user-settings
```

Returns the settings for the current user.

**Response:**
```json
{
  "inactivity_timeout": 30,
  "discord_webhook_url": "https://discord.com/api/webhooks/...",
  "slack_webhook_url": "https://hooks.slack.com/services/...",
  "notifications_enabled": 1,
  "battery_notifications": 1,
  "low_battery_notifications": 1,
  "email_notifications": 0,
  "email_recipients": "",
  "poll_interval": 30
}
```

If no settings exist for the user, default settings are returned.

### Update User Settings

```
POST /api/user-settings
```

Updates the settings for the current user.

**Request Body:**
```json
{
  "inactivity_timeout": 60,
  "discord_webhook_url": "https://discord.com/api/webhooks/...",
  "slack_webhook_url": "https://hooks.slack.com/services/...",
  "notifications_enabled": true,
  "battery_notifications": true,
  "low_battery_notifications": true,
  "email_notifications": false,
  "email_recipients": "",
  "poll_interval": 60
}
```

All fields are optional. Only the fields that are provided will be updated.

**Response:**
```json
{
  "message": "User settings updated",
  "inactivity_timeout": 60,
  "discord_webhook_url": "https://discord.com/api/webhooks/...",
  "slack_webhook_url": "https://hooks.slack.com/services/...",
  "notifications_enabled": 1,
  "battery_notifications": 1,
  "low_battery_notifications": 1,
  "email_notifications": 0,
  "email_recipients": "",
  "poll_interval": 60
}
```

## Debug API

Endpoints for debugging and testing. These endpoints are intended for development and troubleshooting purposes only.

### Get Battery History (Debug)

```
GET /api/debug/battery-history/:upsId
```

Returns the raw battery history for a UPS system directly from the database.

**Query Parameters:**
- `days` (optional): Number of days of history to return (default: 7)

**Response:**
```json
[
  {
    "id": 1,
    "ups_id": 1,
    "charge_percent": 100,
    "timestamp": "2025-02-27T12:00:00.000Z"
  },
  {
    "id": 2,
    "ups_id": 1,
    "charge_percent": 99,
    "timestamp": "2025-02-27T12:05:00.000Z"
  }
]
```

### Record Battery Charge (Debug)

```
POST /api/debug/record-battery/:upsId/:charge
```

Manually records a battery charge percentage for a UPS system.

**URL Parameters:**
- `upsId`: ID of the UPS system
- `charge`: Battery charge percentage (0-100)

**Response:**
```json
{
  "message": "Battery charge recorded",
  "id": 3,
  "upsId": 1,
  "chargePercent": 98,
  "timestamp": "2025-02-27T12:10:00.000Z"
}
```

### List Database Tables

```
GET /api/debug/tables
```

Returns a list of all tables in the database.

**Response:**
```json
[
  {
    "name": "users"
  },
  {
    "name": "nut_servers"
  },
  {
    "name": "ups_systems"
  }
]
```

### Show Table Schema

```
GET /api/debug/schema/:table
```

Returns the schema for a specific database table.

**URL Parameters:**
- `table`: Name of the table

**Response:**
```json
[
  {
    "cid": 0,
    "name": "id",
    "type": "INTEGER",
    "notnull": 0,
    "dflt_value": null,
    "pk": 1
  },
  {
    "cid": 1,
    "name": "username",
    "type": "TEXT",
    "notnull": 1,
    "dflt_value": null,
    "pk": 0
  }
]
```

### Test UPS Monitoring System

```
POST /api/debug/test-ups-monitoring
```

Tests the UPS monitoring system by simulating a status change.

**Request Body:**
```json
{
  "ups_id": 1,
  "ups_name": "Server Room UPS",
  "server_id": 1,
  "new_status": "On Battery",
  "old_status": "Online"
}
```

All fields are optional and have default values.

**Response:**
```json
{
  "message": "UPS monitoring test completed",
  "result": {
    "success": true,
    "notifications": {
      "discord": true,
      "slack": true,
      "email": false
    }
  }
}
```

### Force UPS Status Change

```
POST /api/debug/force-status-change
```

Forces a UPS status change and sends notifications to all users with notifications enabled.

**Request Body:**
```json
{
  "ups_id": 1,
  "new_status": "On Battery",
  "old_status": "Online"
}
```

All fields are optional and have default values.

**Response:**
```json
{
  "message": "Forced status change notifications processed",
  "ups_id": 1,
  "old_status": "Online",
  "new_status": "On Battery",
  "results": [
    {
      "user_id": 1,
      "success": true,
      "results": {
        "discord": { "success": true },
        "slack": { "success": true },
        "email": null
      }
    }
  ]
}
```

### Get Raw UPS Status Values

```
GET /api/debug/ups-status-raw
```

Returns the raw UPS status values from the NUT server.

**Response:**
```json
[
  {
    "id": 1,
    "name": "ups1",
    "displayName": "ups1",
    "model": "APC Smart-UPS 1500",
    "brand": "APC",
    "serial": "AS1234567890",
    "status": "OL",
    "raw_status": "OL",
    "batteryCharge": 100,
    "batteryVoltage": 27.3,
    "inputVoltage": 230.1,
    "outputVoltage": 230.0,
    "runtimeRemaining": 120,
    "load": 30,
    "temperature": 25.5,
    "server": {
      "id": 1,
      "host": "localhost",
      "port": 3493
    }
  }
]
```

### Count Records in a Table

```
GET /api/debug/count/:table
```

Returns the number of records in a specific database table.

**URL Parameters:**
- `table`: Name of the table

**Response:**
```json
{
  "count": 10
}
```

### Check Notification Settings

```
GET /api/debug/notification-settings
```

Returns the notification settings for the current user with masked webhook URLs for security.

**Response:**
```json
{
  "notifications_enabled": true,
  "battery_notifications": true,
  "low_battery_notifications": true,
  "discord_webhook_url": "Configured",
  "slack_webhook_url": "Not configured",
  "email_notifications": false,
  "email_recipients": "None"
}
```

### Test Raw Notification

```
POST /api/debug/raw-notification-test
```

Tests sending a notification with a raw NUT status code.

**Request Body:**
```json
{
  "status": "OB",
  "webhook_url": "https://discord.com/api/webhooks/...",
  "webhook_type": "discord"
}
```

**Response:**
```json
{
  "message": "Raw notification test sent successfully",
  "status": "OB",
  "translated_status": "On Battery",
  "webhook_type": "discord",
  "result": "Success"
}
```

### Test Notification

```
POST /api/debug/test-notification
```

Tests sending a notification using the current user's notification settings.

**Request Body:**
```json
{
  "status": "On Battery",
  "previous_status": "Online",
  "ups_name": "Debug UPS",
  "ups_id": 999
}
```

All fields are optional and have default values.

**Response:**
```json
{
  "message": "Debug notification sent successfully",
  "settings": {
    "discord_webhook_url": "Configured",
    "slack_webhook_url": "Not configured",
    "email_notifications": false,
    "email_recipients": "None"
  },
  "response": {
    "message": "Notifications sent successfully"
  }
}
```

### First-time Setup

```
POST /api/auth/setup
```

Creates the first admin user and configures the initial NUT server.

**Request Body:**
```json
{
  "username": "admin",
  "password": "your_password",
  "nutServer": "localhost",
  "nutPort": 3493
}
```

**Response:**
```json
{
  "message": "Setup completed successfully",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  },
  "token": "jwt_token",
  "nutServer": {
    "id": 1,
    "host": "localhost",
    "port": 3493
  },
  "upsSystemsDiscovered": 2,
  "upsSystemsAdded": [
    {
      "id": 1,
      "name": "ups1",
      "upsName": "ups1",
      "nutServerId": 1
    }
  ]
}
```

### Login

```
POST /api/auth/login
```

Authenticates a user and returns a JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "your_password"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  },
  "token": "jwt_token"
}
```

### Register New User

```
POST /api/auth/register
```

Creates a new user (admin only).

**Request Body:**
```json
{
  "username": "user",
  "email": "user@example.com",
  "password": "user_password"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 2,
    "username": "user",
    "email": "user@example.com",
    "role": "user"
  }
}
```

## Users API

Endpoints for user management.

### Get All Users

```
GET /api/users
```

Returns a list of all users (admin only).

**Response:**
```json
[
  {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "created_at": "2025-02-27T12:00:00.000Z"
  },
  {
    "id": 2,
    "username": "user",
    "email": "user@example.com",
    "role": "user",
    "created_at": "2025-02-27T12:30:00.000Z"
  }
]
```

### Get User

```
GET /api/users/:id
```

Returns information about a specific user. Users can only view their own profile unless they are an admin.

**Response:**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "role": "admin",
  "created_at": "2025-02-27T12:00:00.000Z"
}
```

### Update User

```
PUT /api/users/:id
```

Updates a user's information. Users can only update their own profile unless they are an admin. Only admins can change user roles.

**Request Body:**
```json
{
  "username": "admin2",
  "email": "admin2@example.com",
  "role": "admin"
}
```

**Response:**
```json
{
  "message": "User updated",
  "user": {
    "id": 1,
    "username": "admin2",
    "email": "admin2@example.com",
    "role": "admin",
    "created_at": "2025-02-27T12:00:00.000Z"
  }
}
```

### Delete User

```
DELETE /api/users/:id
```

Deletes a user (admin only). Cannot delete the last admin.

**Response:**
```json
{
  "message": "User deleted"
}
```

## NUT Servers API

Endpoints for managing Network UPS Tools (NUT) servers.

### Get All NUT Servers

```
GET /api/nut-servers
```

Returns a list of all NUT servers.

**Response:**
```json
[
  {
    "id": 1,
    "host": "localhost",
    "port": 3493,
    "username": null,
    "updated_at": "2025-02-27T12:00:00.000Z"
  }
]
```

### Get NUT Server

```
GET /api/nut-servers/:id
```

Returns information about a specific NUT server.

**Response:**
```json
{
  "id": 1,
  "host": "localhost",
  "port": 3493,
  "username": null,
  "updated_at": "2025-02-27T12:00:00.000Z"
}
```

### Add NUT Server

```
POST /api/nut-servers
```

Adds a new NUT server (admin only).

**Request Body:**
```json
{
  "host": "192.168.1.100",
  "port": 3493,
  "username": "upsmon",
  "password": "secret"
}
```

**Response:**
```json
{
  "message": "NUT server created",
  "id": 2,
  "host": "192.168.1.100",
  "port": 3493,
  "username": "upsmon",
  "upsSystemsDiscovered": 1,
  "upsSystemsAdded": [
    {
      "id": 3,
      "name": "ups2",
      "upsName": "ups2",
      "nutServerId": 2
    }
  ]
}
```

### Update NUT Server

```
PUT /api/nut-servers/:id
```

Updates a NUT server (admin only).

**Request Body:**
```json
{
  "host": "192.168.1.101",
  "port": 3493,
  "username": "upsmon",
  "password": "newsecret"
}
```

**Response:**
```json
{
  "message": "NUT server updated",
  "id": 2,
  "host": "192.168.1.101",
  "port": 3493,
  "username": "upsmon"
}
```

### Delete NUT Server

```
DELETE /api/nut-servers/:id
```

Deletes a NUT server and all associated UPS systems (admin only).

**Response:**
```json
{
  "message": "NUT server deleted",
  "deletedUpsSystems": [
    {
      "id": 3,
      "name": "ups2"
    }
  ]
}
```

### Test NUT Server Connection

```
POST /api/nut-servers/:id/test
```

Tests the connection to a NUT server and returns a list of available UPS systems.

**Response:**
```json
{
  "message": "Connection successful",
  "upsList": ["ups1", "ups2"]
}
```

## UPS Systems API

Endpoints for managing UPS systems.

### Get All UPS Systems

```
GET /api/ups-systems
```

Returns a list of all UPS systems with their current status. Requires authentication.

**Response:**
```json
[
  {
    "id": 1,
    "name": "ups1",
    "nickname": "Server Room UPS",
    "displayName": "Server Room UPS",
    "upsName": "ups1",
    "nutServerId": 1,
    "model": "APC Smart-UPS 1500",
    "status": "Online",
    "batteryCharge": 100,
    "batteryVoltage": 27.3,
    "inputVoltage": 230.1,
    "outputVoltage": 230.0,
    "runtimeRemaining": 120,
    "load": 30,
    "temperature": 25.5,
    "batteryDetails": { ... },
    "deviceDetails": { ... },
    "driverDetails": { ... },
    "inputDetails": { ... },
    "outputDetails": { ... },
    "upsDetails": { ... }
  }
]
```

### Get UPS Systems for Kiosk Mode

```
GET /api/ups-systems/kiosk
```

Returns a list of all UPS systems with their current status for kiosk mode. This endpoint does not require authentication and is specifically designed for public displays.

**Response:**
```json
[
  {
    "id": 1,
    "name": "ups1",
    "nickname": "Server Room UPS",
    "displayName": "Server Room UPS",
    "upsName": "ups1",
    "nutServerId": 1,
    "model": "APC Smart-UPS 1500",
    "status": "Online",
    "batteryCharge": 100,
    "batteryVoltage": 27.3,
    "inputVoltage": 230.1,
    "outputVoltage": 230.0,
    "runtimeRemaining": 120,
    "load": 30,
    "temperature": 25.5,
    "batteryDetails": { ... },
    "deviceDetails": { ... },
    "driverDetails": { ... },
    "inputDetails": { ... },
    "outputDetails": { ... },
    "upsDetails": { ... }
  }
]
```

### Get UPS System

```
GET /api/ups-systems/:id
```

Returns detailed information about a specific UPS system.

**Response:**
```json
{
  "id": 1,
  "name": "ups1",
  "nickname": "Server Room UPS",
  "displayName": "Server Room UPS",
  "upsName": "ups1",
  "nutServerId": 1,
  "model": "APC Smart-UPS 1500",
  "status": "Online",
  "batteryCharge": 100,
  "batteryVoltage": 27.3,
  "inputVoltage": 230.1,
  "outputVoltage": 230.0,
  "runtimeRemaining": 120,
  "load": 30,
  "temperature": 25.5,
  "batteryDetails": { ... },
  "deviceDetails": { ... },
  "driverDetails": { ... },
  "inputDetails": { ... },
  "outputDetails": { ... },
  "upsDetails": { ... }
}
```

### Add UPS System

```
POST /api/ups-systems
```

Adds a new UPS system.

**Request Body:**
```json
{
  "name": "ups3",
  "nickname": "Network Closet UPS",
  "nutServerId": 1,
  "upsName": "ups3"
}
```

**Response:**
```json
{
  "message": "UPS system created",
  "id": 4,
  "name": "ups3",
  "nickname": "Network Closet UPS",
  "nutServerId": 1,
  "upsName": "ups3"
}
```

### Update UPS System

```
PUT /api/ups-systems/:id
```

Updates a UPS system.

**Request Body:**
```json
{
  "name": "ups3",
  "nickname": "Updated Network Closet UPS",
  "nutServerId": 1,
  "upsName": "ups3"
}
```

**Response:**
```json
{
  "message": "UPS system updated",
  "id": 4,
  "name": "ups3",
  "nickname": "Updated Network Closet UPS",
  "nutServerId": 1,
  "upsName": "ups3"
}
```

### Update UPS System Nickname

```
PUT /api/ups-systems/:id/nickname
```

Updates just the nickname of a UPS system.

**Request Body:**
```json
{
  "nickname": "New Nickname"
}
```

**Response:**
```json
{
  "message": "UPS system nickname updated",
  "id": 4,
  "nickname": "New Nickname"
}
```

### Delete UPS System

```
DELETE /api/ups-systems/:id
```

Deletes a UPS system (admin only).

**Response:**
```json
{
  "message": "UPS system deleted",
  "id": 4
}
```

### Get Battery History

```
GET /api/ups-systems/:id/battery
```

Returns the battery charge history for a UPS system.

**Query Parameters:**
- `limit` (optional): Maximum number of records to return (default: 100)

**Response:**
```json
[
  {
    "id": 1,
    "ups_id": 1,
    "charge_percent": 100,
    "timestamp": "2025-02-27T12:00:00.000Z"
  },
  {
    "id": 2,
    "ups_id": 1,
    "charge_percent": 99,
    "timestamp": "2025-02-27T12:05:00.000Z"
  }
]
```

### Record Battery Charge

```
POST /api/ups-systems/:id/battery
```

Manually records a battery charge percentage for a UPS system.

**Request Body:**
```json
{
  "chargePercent": 98
}
```

**Response:**
```json
{
  "message": "Battery charge recorded",
  "id": 3,
  "upsId": 1,
  "chargePercent": 98,
  "timestamp": "2025-02-27T12:10:00.000Z"
}
```

## Notifications API

Endpoints for managing notification settings and sending notifications.

### Get Notification Settings

```
GET /api/notifications/settings
```

Returns the notification settings for the current user.

**Response:**
```json
{
  "discord_webhook_url": "https://discord.com/api/webhooks/...",
  "slack_webhook_url": "https://hooks.slack.com/services/...",
  "notifications_enabled": true,
  "battery_notifications": true,
  "low_battery_notifications": true,
  "email_notifications": false,
  "email_recipients": ""
}
```

### Update Notification Settings

```
POST /api/notifications/settings
```

Updates the notification settings for the current user.

**Request Body:**
```json
{
  "discord_webhook_url": "https://discord.com/api/webhooks/...",
  "slack_webhook_url": "https://hooks.slack.com/services/...",
  "notifications_enabled": true,
  "battery_notifications": true,
  "low_battery_notifications": true,
  "email_notifications": true,
  "email_recipients": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Notification settings updated",
  "discord_webhook_url": "https://discord.com/api/webhooks/...",
  "slack_webhook_url": "https://hooks.slack.com/services/...",
  "notifications_enabled": true,
  "battery_notifications": true,
  "low_battery_notifications": true,
  "email_notifications": true,
  "email_recipients": "user@example.com"
}
```

### Send Test Discord Notification

```
POST /api/notifications/test
```

Sends a test notification to Discord.

**Request Body:**
```json
{
  "discord_webhook_url": "https://discord.com/api/webhooks/..."
}
```

**Response:**
```json
{
  "message": "Test notification sent successfully"
}
```

### Send Test Slack Notification

```
POST /api/notifications/test-slack
```

Sends a test notification to Slack.

**Request Body:**
```json
{
  "slack_webhook_url": "https://hooks.slack.com/services/..."
}
```

**Response:**
```json
{
  "message": "Test notification sent successfully to Slack"
}
```

### Send Test Email Notification

```
POST /api/notifications/test-email
```

Sends a test notification via email.

**Request Body:**
```json
{
  "email_recipients": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Test notification sent successfully to email recipients"
}
```

### Get Notification History

```
GET /api/notifications/history
```

Returns the notification history for the current user.

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "ups_id": 1,
    "ups_name": "Server Room UPS",
    "status": "On Battery",
    "previous_status": "Online",
    "created_at": "2025-02-27T12:00:00.000Z"
  }
]
```

### Send UPS Status Notification

```
POST /api/notifications/ups-status
```

Sends a notification about a UPS status change.

**Request Body:**
```json
{
  "ups_id": 1,
  "ups_name": "Server Room UPS",
  "status": "On Battery",
  "previous_status": "Online",
  "discord_webhook_url": "https://discord.com/api/webhooks/...",
  "slack_webhook_url": "https://hooks.slack.com/services/...",
  "email_notifications": true,
  "email_recipients": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Notifications sent successfully"
}
```

## System API

Endpoints for system management.

### Get System Version

```
GET /api/system/version
```

Returns the current application version.

**Response:**
```json
{
  "version": "1.8.1"
}
```

### Update System

```
POST /api/system/update
```

Initiates a system update by pulling the latest Docker image and restarting (admin only).

**Response:**
```json
{
  "message": "Update initiated successfully",
  "details": "The application will restart shortly. Please refresh the page after a minute."
}
