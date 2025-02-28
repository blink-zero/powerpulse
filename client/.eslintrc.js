module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react', 'react-hooks'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react/prop-types': 'warn', // Warn about missing prop types
    'no-unused-vars': 'warn', // Warn about unused variables
    'react-hooks/rules-of-hooks': 'error', // Enforce Rules of Hooks
    'react-hooks/exhaustive-deps': 'warn', // Warn about missing dependencies
    'no-console': ['warn', { allow: ['warn', 'error'] }], // Warn about console.log, but allow console.warn and console.error
  },
};
