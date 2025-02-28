/**
 * Application configuration
 * Central place for application-wide configuration values
 */

// Import version from package.json
import packageJson from '../../package.json';

export const APP_VERSION = packageJson.version;

export default {
  version: APP_VERSION,
  appName: 'PowerPulse',
  githubUrl: 'https://github.com/blink-zero/powerpulse',
  copyrightYear: new Date().getFullYear(),
  copyrightOwner: 'blink-zero'
};
