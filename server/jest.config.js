module.exports = {
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  testPathIgnorePatterns: ['/node_modules/'],
  transform: {},
  // Since we're using CommonJS in the server, we don't need to transform
  // If you switch to ES modules, you might need to add transformers
};
