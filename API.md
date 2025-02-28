# PowerPulse API Documentation

This document provides detailed information about the PowerPulse API endpoints.

## Table of Contents

- [Authentication](#authentication)
- [Auth API](#auth-api)
- [Users API](#users-api)
- [NUT Servers API](#nut-servers-api)
- [UPS Systems API](#ups-systems-api)
- [Notifications API](#notifications-api)
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

Returns a list of all UPS systems with their current status.

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
