# PowerPulse Frontend Architecture

This document outlines the architecture and code organization of the PowerPulse frontend application.

## Code Structure

The frontend code is organized into the following directories:

- **components/**: Reusable UI components
- **context/**: React context providers
- **hooks/**: Custom React hooks
- **pages/**: Page components
- **services/**: API service layer
- **types/**: Type definitions
- **utils/**: Utility functions

## API Service Layer

The API service layer provides a centralized way to interact with the backend API. It consists of:

- **api.js**: Base API configuration with Axios
- **authService.js**: Authentication-related API calls
- **nutService.js**: NUT server-related API calls
- **upsService.js**: UPS system-related API calls

Example usage:

```javascript
import { getUpsSystems } from '../services/upsService';
import { useApi } from '../hooks/useApi';

// In a component
const { data: upsSystems, loading, error } = useApi(getUpsSystems);
```

## Custom Hooks

### useApi

A hook for making API calls with loading and error states.

```javascript
const { data, loading, error, execute, setData } = useApi(apiFunction, immediate, initialData);
```

### usePollingApi

A hook for polling API calls at regular intervals.

```javascript
const { data, loading, error } = usePollingApi(apiFunction, intervalMs, initialData);
```

### useForm

A hook for form handling with validation.

```javascript
const { 
  values, 
  errors, 
  touched, 
  isSubmitting, 
  handleChange, 
  handleBlur, 
  handleSubmit,
  setFieldValue,
  setFieldError,
  resetForm,
  validateForm
} = useForm(initialValues, validationRules, onSubmit);
```

### useSettings

A hook for accessing and updating application settings.

```javascript
const { settings, updateSetting, resetSettings, getPollIntervalMs } = useSettings();

// Access settings
const { notifications, batteryNotifications, pollInterval } = settings;

// Update a setting
updateSetting('notifications', true);

// Reset all settings to defaults
resetSettings();

// Get poll interval in milliseconds
const intervalMs = getPollIntervalMs();
```

## Reusable Components

### Navigation Components

The application uses a set of modular navigation components for consistent layout:

- `Sidebar`: Main sidebar component that contains the sidebar header, navigation menu, and user profile
- `SidebarHeader`: Header section of the sidebar with the application logo and title
- `SidebarNavigation`: Navigation menu in the sidebar with links to different pages
- `UserProfile`: User profile section in the sidebar with user information and logout button
- `Header`: Top navigation bar with mobile menu toggle and user actions
- `Footer`: Footer component with application version and links
- `NavItem`: Reusable navigation item component used in the sidebar navigation

```jsx
// Layout component using the navigation components
<div className="flex h-screen bg-gray-50 dark:bg-gray-900">
  <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
  <div className="flex-1 flex flex-col md:pl-64">
    <Header toggleSidebar={toggleSidebar} />
    <main className="flex-1 overflow-y-auto p-4">
      <Outlet />
    </main>
    <Footer />
  </div>
</div>
```

### Button

A customizable button component with variants, sizes, and loading state.

```jsx
<Button 
  variant="primary" 
  size="md" 
  loading={isLoading}
  onClick={handleClick}
>
  Click Me
</Button>
```

### Card

A card component for displaying content in a consistent way.

```jsx
<Card 
  title="Card Title" 
  titleIcon={<FiInfo />}
  actions={<Button>Action</Button>}
>
  Card content goes here
</Card>
```

### ErrorBoundary

A component that catches JavaScript errors in its child component tree and displays a fallback UI.

```jsx
<ErrorBoundary fallbackMessage="Something went wrong">
  <YourComponent />
</ErrorBoundary>
```

### FormField

A standardized form field component.

```jsx
<FormField
  id="username"
  name="username"
  label="Username"
  type="text"
  value={values.username}
  onChange={handleChange}
  onBlur={handleBlur}
  error={errors.username}
  touched={touched.username}
  required
/>
```

### Modal

A modal dialog component.

```jsx
<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Modal Title"
  size="md"
  footer={
    <Modal.Footer
      onCancel={() => setIsModalOpen(false)}
      onConfirm={handleConfirm}
      loading={isLoading}
    />
  }
>
  Modal content goes here
</Modal>
```

### Toast

A toast notification system.

```jsx
// In a component
import { useToast } from '../components/ToastContainer';

const { success, error, info, warning } = useToast();

// Show a success toast
success('Operation completed successfully');
```

### UpsCard

A specialized component for displaying UPS system information.

```jsx
<UpsCard
  ups={upsSystem}
  isSelected={selectedUps?.id === upsSystem.id}
  onClick={handleUpsSelect}
/>
```

## Error Handling

The application uses a combination of error boundaries and toast notifications for error handling.

```jsx
// Global error boundary in App.jsx
<ErrorBoundary>
  <ToastProvider>
    <Routes>
      {/* ... */}
    </Routes>
  </ToastProvider>
</ErrorBoundary>

// Component-level error handling
try {
  // Some operation that might fail
} catch (error) {
  logError('Component', error);
  toast.error(formatErrorMessage(error));
}
```

## Form Validation

Form validation is handled using the `createValidator` utility and the `useForm` hook.

```javascript
const validationRules = {
  username: {
    required: true,
    minLength: 3,
    maxLength: 20
  },
  email: {
    validator: isValidEmail,
    message: 'Please enter a valid email address'
  },
  password: {
    required: true,
    validator: (value) => isValidPassword(value),
    message: 'Password must be at least 8 characters with uppercase, lowercase, and number'
  }
};

const { values, errors, touched, handleChange, handleBlur, handleSubmit } = 
  useForm(initialValues, validationRules, onSubmit);
```

## Discord Webhook Notifications System

The application includes a Discord webhook notifications system for UPS status changes. This system sends notifications to a Discord channel when UPS status changes occur.

### Configuration

Notifications can be configured in the Settings page:

- **Enable notifications**: Master toggle for all notifications
- **Discord Webhook URL**: The URL of the Discord webhook to send notifications to
- **Battery status notifications**: Get notified when a UPS goes on battery power
- **Low battery notifications**: Get notified when a UPS battery is running low

### Implementation

The notifications system is implemented in the UPSSystemsPage component and the server-side notifications API:

```javascript
// In UPSSystemsPage.jsx
const { settings } = useSettings();
const previousUpsStates = useRef({});

// Check for status changes and send notifications
useEffect(() => {
  if (!upsSystems.length || loading) return;

  // Check if notifications are enabled
  if (!settings.notifications || !settings.discordWebhookUrl) return;

  // Check for status changes
  upsSystems.forEach(ups => {
    const prevState = previousUpsStates.current[ups.id];
    
    // Skip if no previous state (first load)
    if (!prevState) {
      previousUpsStates.current[ups.id] = {
        status: ups.status,
        batteryCharge: ups.batteryCharge
      };
      return;
    }

    // Check for status changes
    if (prevState.status !== ups.status) {
      // Check if notifications are enabled for this status change
      if ((settings.batteryNotifications && 
           ups.status?.toLowerCase() === 'on battery' && 
           prevState.status?.toLowerCase() !== 'on battery') ||
          (settings.lowBatteryNotifications && 
           ups.status?.toLowerCase() === 'low battery' && 
           prevState.status?.toLowerCase() !== 'low battery') ||
          (ups.status?.toLowerCase() === 'online' && 
           prevState.status?.toLowerCase() !== 'online')) {
        
        // Send notification to server
        axios.post('/api/notifications/ups-status', {
          ups_id: ups.id,
          ups_name: ups.displayName || ups.name,
          status: ups.status,
          previous_status: prevState.status,
          discord_webhook_url: settings.discordWebhookUrl
        }).catch(error => {
          console.error('Error sending notification:', error);
        });
      }
    }
    
    // Update previous state
    previousUpsStates.current[ups.id] = {
      status: ups.status,
      batteryCharge: ups.batteryCharge
    };
  });
}, [upsSystems, settings.notifications, settings.batteryNotifications, settings.lowBatteryNotifications, settings.discordWebhookUrl, loading]);
```

### Server-side Implementation

The server-side implementation handles sending notifications to Discord:

```javascript
// In server/routes/notifications.js
router.post('/ups-status', authenticateToken, async (req, res) => {
  const { ups_id, ups_name, status, previous_status, discord_webhook_url } = req.body;
  
  try {
    let title, description, color;
    
    if (status.toLowerCase() === 'on battery') {
      title = '⚡ UPS On Battery';
      description = `**${ups_name}** is now running on battery power.\nPrevious status: ${previous_status}`;
      color = '#FFA500'; // Orange
    } else if (status.toLowerCase() === 'low battery') {
      title = '🔋 UPS Low Battery Warning';
      description = `**${ups_name}** has a low battery.\nPrevious status: ${previous_status}`;
      color = '#FF0000'; // Red
    } else if (status.toLowerCase() === 'online') {
      title = '✅ UPS Back Online';
      description = `**${ups_name}** is now back online.\nPrevious status: ${previous_status}`;
      color = '#00FF00'; // Green
    } else {
      title = '🔄 UPS Status Change';
      description = `**${ups_name}** status changed to ${status}.\nPrevious status: ${previous_status}`;
      color = '#7289DA'; // Discord blue
    }
    
    await sendDiscordNotification(discord_webhook_url, { title, description, color });
    
    // Log the notification
    db.run(
      `INSERT INTO notification_logs 
       (user_id, ups_id, ups_name, status, previous_status) 
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, ups_id, ups_name, status, previous_status]
    );
    
    return res.json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Error sending UPS status notification:', error);
    return res.status(500).json({ 
      message: 'Error sending notification', 
      error: error.message 
    });
  }
});
```

### Testing Discord Webhook

The application provides a way to test the Discord webhook in the Settings page:

```javascript
// In SettingsPage.jsx
<button
  onClick={async () => {
    if (!settings.discordWebhookUrl) {
      setError('Please enter a Discord webhook URL');
      return;
    }
    
    try {
      await axios.post('/api/notifications/test', {
        discord_webhook_url: settings.discordWebhookUrl
      });
      
      setSuccess('Test notification sent to Discord');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send test notification');
    }
  }}
  disabled={!settings.notifications || !settings.discordWebhookUrl}
  className="..."
>
  <FiBell className="mr-2 -ml-1 h-4 w-4" />
  Test Discord Webhook
</button>
```

## Type Definitions

Type definitions are provided using JSDoc comments for better code documentation and IDE support.

```javascript
/**
 * @typedef {Object} UpsSystem
 * @property {number} id - UPS ID
 * @property {string} name - UPS name
 * @property {string} status - UPS status
 * @property {number|null} batteryCharge - Battery charge percentage
 */
