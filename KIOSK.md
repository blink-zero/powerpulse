# PowerPulse Kiosk Mode

This document provides detailed information about the PowerPulse Kiosk Mode feature, which allows you to display UPS monitoring information on dedicated screens without requiring authentication.

## Table of Contents

- [Overview](#overview)
- [Accessing Kiosk Mode](#accessing-kiosk-mode)
- [URL Parameters](#url-parameters)
- [View Modes](#view-modes)
- [Setting Up a Dedicated Display](#setting-up-a-dedicated-display)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

## Overview

Kiosk Mode is designed for displaying UPS monitoring information on dedicated screens in server rooms, network operations centers (NOCs), or other locations where you want to have a continuous display of UPS status. Key features include:

- **No Authentication Required**: Accessible without logging in
- **Auto-rotation**: Automatically cycles through UPS systems
- **Multi-view Mode**: Display all UPS systems at once
- **Dark Theme**: Easy on the eyes for continuous display
- **Responsive Design**: Works on various screen sizes
- **No Session Timeout**: Runs continuously without logging out
- **URL Parameters**: Customize the display via URL parameters

## Accessing Kiosk Mode

Kiosk Mode is accessible via the `/kiosk` URL path. For example:

```
http://your-powerpulse-server/kiosk
```

By default, this will display all UPS systems in single-view mode with auto-rotation.

## URL Parameters

You can customize the Kiosk Mode display using the following URL parameters:

### Multi-view Mode

To enable multi-view mode (displaying all UPS systems at once):

```
http://your-powerpulse-server/kiosk?multi=true
```

To switch back to single-view mode:

```
http://your-powerpulse-server/kiosk?multi=false
```

### UPS Selection

To display only specific UPS systems, use the `ups` parameter with a comma-separated list of UPS IDs:

```
http://your-powerpulse-server/kiosk?ups=1,3,5
```

This will only display UPS systems with IDs 1, 3, and 5.

### Combining Parameters

You can combine parameters to customize the display further:

```
http://your-powerpulse-server/kiosk?multi=true&ups=1,3,5
```

This will display UPS systems with IDs 1, 3, and 5 in multi-view mode.

## View Modes

### Single-view Mode

In single-view mode, Kiosk Mode displays one UPS system at a time and automatically rotates between them every 10 seconds. This mode provides detailed information about each UPS system, including:

- Battery charge percentage
- Runtime remaining
- Load percentage
- Input/output voltage
- Battery voltage
- Temperature (if available)

You can manually navigate between UPS systems using the dots at the bottom of the screen.

### Multi-view Mode

In multi-view mode, Kiosk Mode displays all UPS systems at once in a grid layout. This mode provides a summary of each UPS system, including:

- Battery charge percentage
- Runtime remaining
- Load percentage
- Input/output voltage (if available)

You can toggle between single-view and multi-view modes using the button in the top-right corner of the screen.

## Setting Up a Dedicated Display

For optimal use of Kiosk Mode on a dedicated display:

1. **Use a dedicated device**: A Raspberry Pi, small form-factor PC, or smart TV with a web browser works well
2. **Set up auto-start**: Configure the browser to start automatically and load the Kiosk Mode URL
3. **Disable screen saver and power saving**: Ensure the display stays on continuously
4. **Use full-screen mode**: Configure the browser to run in full-screen mode (F11 in most browsers)
5. **Disable browser UI**: Hide address bar, tabs, and other browser UI elements
6. **Consider display rotation**: For portrait displays, consider using CSS to rotate the display

### Example: Setting up Kiosk Mode on a Raspberry Pi

1. Install Raspberry Pi OS
2. Install Chromium browser
3. Create an autostart file:
   ```
   mkdir -p ~/.config/autostart
   nano ~/.config/autostart/kiosk.desktop
   ```
4. Add the following content:
   ```
   [Desktop Entry]
   Type=Application
   Name=PowerPulse Kiosk
   Exec=chromium-browser --noerrdialogs --disable-infobars --kiosk http://your-powerpulse-server/kiosk
   ```
5. Save and reboot

## Security Considerations

While Kiosk Mode does not require authentication, it only provides read-only access to UPS status information. No sensitive configuration data or user information is exposed through Kiosk Mode.

However, you should consider the following security aspects:

- Kiosk Mode is designed for use on internal networks
- If your PowerPulse instance is exposed to the internet, consider using a reverse proxy with IP restrictions for the `/kiosk` path
- The data shown in Kiosk Mode is the same as what authenticated users see on the dashboard
- No administrative actions can be performed through Kiosk Mode

## Troubleshooting

### Kiosk Mode Not Loading

If Kiosk Mode is not loading:

1. Verify that the PowerPulse server is running
2. Check that you can access the main PowerPulse login page
3. Verify that the URL is correct (http://your-powerpulse-server/kiosk)
4. Check browser console for any JavaScript errors
5. Ensure your browser supports modern JavaScript features

### UPS Systems Not Showing

If UPS systems are not showing in Kiosk Mode:

1. Verify that UPS systems are configured in PowerPulse
2. Check that the NUT server is running and accessible
3. Verify that UPS systems are visible in the main dashboard when logged in
4. If using the `ups` parameter, ensure the UPS IDs are correct

### Auto-rotation Not Working

If auto-rotation is not working in single-view mode:

1. Ensure you have more than one UPS system configured
2. Check that you are not in multi-view mode
3. Verify that JavaScript is enabled in your browser
4. Check browser console for any errors

### Display Issues

If you experience display issues:

1. Try a different browser
2. Ensure your browser is up to date
3. Check that JavaScript is enabled
4. Try clearing browser cache and cookies
5. Adjust the browser zoom level if needed
