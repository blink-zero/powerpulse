/**
 * This file is a compatibility layer for the old entry point.
 * It simply requires the new entry point (server.js) to ensure
 * that scripts or commands that still reference index.js will work.
 * 
 * For new development, please use server.js directly.
 */

console.log('Warning: You are using the deprecated index.js entry point. Please update your scripts to use server.js instead.');

// Require the new entry point
require('./server');
