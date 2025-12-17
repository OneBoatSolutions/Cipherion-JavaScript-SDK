// tests/setup.ts
import { config } from 'dotenv';


config({ path: '.env.test' });

// Global test setup
beforeAll(() => {
  process.env.NODE_ENV = '';
  process.env.CIPHERION_BASE_URL = '';
  process.env.CIPHERION_PROJECT_ID = '';
  process.env.CIPHERION_API_KEY = '';
  process.env.CIPHERION_PASSPHRASE = '';
});

afterAll(() => {

});


global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};