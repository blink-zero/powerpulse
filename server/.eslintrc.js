module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'warn', // Warn about unused variables
    'no-console': 'off', // Allow console in server code
    'no-process-exit': 'warn', // Warn about process.exit()
    'no-useless-escape': 'warn', // Warn about unnecessary escape characters
    'no-empty': 'warn', // Warn about empty blocks
    'prefer-const': 'warn', // Prefer const over let when possible
    'no-var': 'warn', // Prefer let/const over var
  },
};
