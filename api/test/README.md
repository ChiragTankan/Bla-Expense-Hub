# Testing Guide for CADFrame API

This guide explains the testing approach for CADFrame API, based on the pattern used in TIC2DO project.

**IMPORTANT**: We do NOT use mocks in our tests. Instead, we:

- Use a real CI database for testing
- Use factories to create test data
- Clean the database between tests for isolation
- Follow the same patterns as TIC2DO project

## Setup

### 1. Install Dependencies

All required testing dependencies are already installed:

- `@gskglobal/nestjs-testfx` - Factory pattern and test utilities
- `@nestjs/jwt` - JWT authentication for tests
- `neverthrow` - Result type for error handling
- `@faker-js/faker` - Generate fake data

### 2. Configure Test Database

Create a `.ci.env` file in the `api` directory (use `.ci.env.example` as template):

```env
NODE_ENV=ci
DB_HOST=localhost
DB_PORT=1433
DB_USERNAME=sa
DB_PASSWORD=YourTestPassword123!
DB_DATABASE=cadframe-ci  # MUST contain 'ci' or 'test'
DB_ENCRYPT=false
JWT_SECRET=test-jwt-secret-for-testing-only
```

**Safety Checks**:

- Database name MUST contain 'ci' or 'test' to prevent accidental production database usage
- Tests will fail if `NODE_ENV` is not set to 'ci' or 'test'

### 3. Run Migrations

Before running tests, ensure the CI database is set up:

```bash
npm run migration:ci
```

## Test Structure

### Core Test Files

```
test/
├── jest.setup.ts           # Jest configuration and safety checks
├── test-datasource.ts      # Database connection for tests
├── test-utils.ts           # Utility functions for tests
└── factories/
    ├── index.ts            # Factory manager
    ├── role.factory.ts     # Role entity factory
    ├── user.factory.ts     # User entity factory
    ├── user-role.factory.ts # UserRole entity factory
    ├── job.factory.ts      # Job entity factory
    └── canvas.factory.ts   # Canvas entity factory
```

## Writing Tests

### Basic Test Template

```typescript
import { TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  initializeTestDatabase,
  closeTestDatabase,
  cleanDatabase,
  getDbHelper,
  createTestModule,
  UserFactory,
  RoleFactory,
} from '../../test/test-utils';
import { YourService } from './your.service';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';

describe('YourService', () => {
  let module: TestingModule;
  let yourService: YourService;
  let userFactory: UserFactory;
  let roleFactory: RoleFactory;

  beforeAll(async () => {
    // Initialize database connection and factories
    const { dataSource } = await initializeTestDatabase();
    userFactory = new UserFactory(dataSource);
    roleFactory = new RoleFactory(dataSource);

    // Create test module with TypeORM entities
    module = await createTestModule({
      imports: [TypeOrmModule.forFeature([User, Role])],
      providers: [YourService],
    });

    yourService = module.get<YourService>(YourService);
  });

  afterAll(async () => {
    // Clean up
    await module.close();
    await closeTestDatabase();
  });

  beforeEach(async () => {
    // Clean database before each test for isolation
    await cleanDatabase();
  });

  describe('yourMethod', () => {
    it('should work correctly', async () => {
      // Arrange: Create test data using factories
      const role = await roleFactory.create({ name: 'engineer' });
      const user = await userFactory.create({
        email: 'test@example.com',
        isActive: true,
      });

      // Act: Call the service method
      const result = await yourService.yourMethod(user.id);

      // Assert: Verify results
      expect(result.success).toBe(true);

      // Verify in database
      const dbHelper = getDbHelper();
      const exists = await dbHelper.entityExists(User, { id: user.id });
      expect(exists).toBe(true);
    });
  });
});
```

### Using Factories

Factories help create test entities with sensible defaults:

```typescript
// Create with defaults
const user = await userFactory.create();

// Create with overrides
const user = await userFactory.create({
  email: 'specific@example.com',
  firstName: 'John',
  isActive: true,
});

// Build without saving (useful for testing validation)
const unsavedUser = userFactory.build({
  email: 'test@example.com',
});
```

### Database Helpers

The `DatabaseTestHelper` provides utilities:

```typescript
import { getDbHelper } from '../../test/test-utils';

const dbHelper = getDbHelper();

// Check if entity exists
const exists = await dbHelper.entityExists(User, { email: 'test@example.com' });

// Find an entity
const user = await dbHelper.findOne(User, { id: 123 });

// Clean database (already called in beforeEach)
await dbHelper.cleanDatabase(['user', 'role']);
```

## Available Factories

### RoleFactory

```typescript
await roleFactory.create({ name: 'admin', description: 'Admin role' });
```

### UserFactory

```typescript
await userFactory.create({
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '5551234567',
  address: '123 Main St',
  isActive: true,
});
```

### UserRoleFactory

```typescript
await userRoleFactory.create({
  userId: user.id,
  roleId: role.id,
});
```

### JobFactory

```typescript
await jobFactory.create({
  title: 'Test Job',
  description: 'Job description',
  location: 'City',
  jobAddress: '123 Job St',
  status: 0,
  createdById: user.id,
});
```

### CanvasFactory

```typescript
await canvasFactory.create({
  jobId: job.id,
  data: JSON.stringify({ elements: [] }),
  version: 1,
  createdById: user.id,
});
```

## FactoryManager (Alternative Approach)

Instead of creating individual factories, use the FactoryManager:

```typescript
import { createFactoryManager } from '../../test/test-utils';

const factories = createFactoryManager();

const role = await factories.role.create({ name: 'admin' });
const user = await factories.user.create({ email: 'test@example.com' });
const job = await factories.job.create({ createdById: user.id });
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e
```

## Best Practices

### 1. ✅ DO: Use Real Database

```typescript
// GOOD: Create real entities
const user = await userFactory.create({ email: 'test@example.com' });
const result = await userService.findByEmail('test@example.com');
expect(result?.id).toBe(user.id);
```

### 2. ❌ DON'T: Use Mocks

```typescript
// BAD: Don't use mocks
const mockRepository = {
  findOne: jest.fn().mockResolvedValue(mockUser),
};
```

### 3. ✅ DO: Clean Database Between Tests

```typescript
beforeEach(async () => {
  await cleanDatabase();
});
```

### 4. ✅ DO: Verify in Database

```typescript
const dbHelper = getDbHelper();
const exists = await dbHelper.entityExists(User, { email: 'test@example.com' });
expect(exists).toBe(true);
```

### 5. ✅ DO: Test Error Cases

```typescript
it('should return error when user not found', async () => {
  const result = await userService.findOne(99999);

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.code).toBe('NOT_FOUND');
  }
});
```

### 6. ✅ DO: Use Factory Relationships

```typescript
// Create related entities in correct order
const role = await roleFactory.create({ name: 'engineer' });
const user = await userFactory.create({ email: 'test@example.com' });
await userRoleFactory.create({ userId: user.id, roleId: role.id });
```

## Common Patterns

### Testing Service Creation

```typescript
it('should create an entity', async () => {
  const creator = await userFactory.create();

  const result = await service.create({
    title: 'Test',
    createdById: creator.id,
  });

  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.id).toBeDefined();

    const dbHelper = getDbHelper();
    const exists = await dbHelper.entityExists(Entity, { id: result.data.id });
    expect(exists).toBe(true);
  }
});
```

### Testing Service Update

```typescript
it('should update an entity', async () => {
  const entity = await entityFactory.create({ name: 'Old Name' });

  const result = await service.update(entity.id, { name: 'New Name' });

  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.name).toBe('New Name');
  }

  const dbHelper = getDbHelper();
  const updated = await dbHelper.findOne(Entity, { id: entity.id });
  expect(updated?.name).toBe('New Name');
});
```

### Testing Service Delete

```typescript
it('should delete an entity', async () => {
  const entity = await entityFactory.create();

  const result = await service.remove(entity.id);

  expect(result.success).toBe(true);

  const dbHelper = getDbHelper();
  const exists = await dbHelper.entityExists(Entity, { id: entity.id });
  expect(exists).toBe(false);
});
```

## Troubleshooting

### Database Connection Issues

- Ensure SQL Server is running
- Check `.ci.env` configuration
- Verify database exists and migrations are run

### Tests Failing Due to Foreign Keys

- Check cleanup order in `test-utils.ts` (`CLEANUP_ORDER` array)
- Ensure child entities are cleaned before parent entities

### Timeout Errors

- Default timeout is 30 seconds (set in `jest.setup.ts`)
- If needed, increase: `jest.setTimeout(60000);`

## References

- TIC2DO test files are the source of truth for patterns
- Check `TIC2DO/api/test/` for reference implementations
- Check `TIC2DO/api/src/**/*.spec.ts` for example tests

## Migration from Mock-based Tests

If you have existing mock-based tests:

1. Remove all mock repositories and jest.fn() calls
2. Add factory initialization in `beforeAll`
3. Use factories to create test data
4. Add database verification using `getDbHelper()`
5. Ensure `cleanDatabase()` is called in `beforeEach`

Example migration:

```typescript
// BEFORE (with mocks)
const mockRepository = {
  findOne: jest.fn().mockResolvedValue(mockUser),
};

// AFTER (with factories)
const user = await userFactory.create({ email: 'test@example.com' });
const result = await service.findByEmail('test@example.com');
```
