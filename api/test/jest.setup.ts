import { config } from 'dotenv';
import { join } from 'path';

// Load CI environment variables
config({ path: join(__dirname, '..', '.ci.env') });

// Safety check: Ensure we're running in CI/test environment
if (process.env.NODE_ENV !== 'ci' && process.env.NODE_ENV !== 'test') {
  console.error(
    '\x1b[31m%s\x1b[0m',
    '❌ SAFETY CHECK FAILED: Tests must run with NODE_ENV=ci or NODE_ENV=test',
  );
  console.error(
    '\x1b[33m%s\x1b[0m',
    '   Run tests with: npm run test or npm run test:e2e',
  );
  process.exit(1);
}

// Validate test database name contains 'ci' or 'test' (skip if unset for unit tests)
const dbName = process.env.DB_DATABASE || '';
if (dbName && !dbName.includes('ci') && !dbName.includes('test')) {
  console.error(
    '\x1b[31m%s\x1b[0m',
    `❌ SAFETY CHECK FAILED: Database name "${dbName}" must contain 'ci' or 'test'`,
  );
  console.error(
    '\x1b[33m%s\x1b[0m',
    '   This prevents accidentally running tests against production database',
  );
  process.exit(1);
}

// Increase timeout for database operations
jest.setTimeout(30000);

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
