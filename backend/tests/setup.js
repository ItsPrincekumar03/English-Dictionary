// tests/setup.js
const logger = require('../src/utils/logger');

// Silence the application logger during tests so the terminal isn't cluttered
beforeAll(() => {
  jest.spyOn(logger, 'info').mockImplementation(() => {});
  jest.spyOn(logger, 'warn').mockImplementation(() => {});
  jest.spyOn(logger, 'error').mockImplementation(() => {});
  jest.spyOn(logger, 'debug').mockImplementation(() => {});
});

// Restore logger
afterAll(() => {
  jest.restoreAllMocks();
});
