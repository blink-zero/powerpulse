const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const nutServerRoutes = require('./routes/nutServers');
const upsSystemRoutes = require('./routes/upsSystems');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const userSettingsRoutes = require('./routes/userSettings');
const debugRoutes = require('./routes/debug');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/nut/servers', nutServerRoutes);
app.use('/api/ups/systems', upsSystemRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/user-settings', userSettingsRoutes);
app.use('/api/debug', debugRoutes);

// Legacy route for backward compatibility
app.use('/api/nut', nutServerRoutes);

// Serve static files from the client build directory in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.resolve(__dirname, '../client/dist');
  
  app.use(express.static(clientBuildPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

module.exports = app;
