import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import {
  Type,
  DynamicModule,
  ForwardReference,
  Provider,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import {
  DatabaseTestHelper,
  EntityComparator,
  createTestApp,
  createAuthHelper,
  createTestToken,
  getJwtService,
} from '@gskglobal/nestjs-testfx';
import { DataSource } from 'typeorm';
import {
  initializeTransactionalContext,
  addTransactionalDataSource,
  StorageDriver,
} from 'typeorm-transactional';
import { TestDataSource } from './test-datasource';
import { allConfigs } from '../src/config';
import { LoggerModule } from '../src/logger/Logger.module';
import { FactoryManager } from './factories';

export const TEST_JWT_SECRET = 'test-jwt-secret-for-testing-only';

export { createAuthHelper, createTestToken, getJwtService, createTestApp };

export type {
  TestJwtPayload,
  AuthHelper,
  AuthenticatedRequest,
} from '@gskglobal/nestjs-testfx';

type ModuleImport =
  | Type<unknown>
  | DynamicModule
  | Promise<DynamicModule>
  | ForwardReference<unknown>;

// export * from './factories';

export { DatabaseTestHelper, EntityComparator };

// Cleanup order respects foreign key constraints (children before parents)
const CLEANUP_ORDER = [
  'externalContactRepresentative',
  'externalContact',
  'organizationRepresentative',
  'organizationBusinessEntity',
  'organization',
  'userBusinessEntity',
  'businessEntity',
  'userRole',
  'user',
  'role',
  'sector',
  'organizationType',
];

let dataSource: DataSource | null = null;
let dbHelper: DatabaseTestHelper | null = null;
let transactionalContextInitialized = false;

export async function initializeTestDatabase(): Promise<{
  dataSource: DataSource;
  dbHelper: DatabaseTestHelper;
}> {
  if (!dataSource || !dataSource.isInitialized) {
    dataSource = await TestDataSource.initialize();
  }

  if (!transactionalContextInitialized) {
    initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });
    addTransactionalDataSource(dataSource);
    transactionalContextInitialized = true;
  }

  dbHelper = await DatabaseTestHelper.fromDataSource(dataSource, {
    cleanupOrder: CLEANUP_ORDER,
    dialect: 'mssql',
  });

  return { dataSource, dbHelper };
}

export function getDbHelper(): DatabaseTestHelper {
  if (!dbHelper) {
    throw new Error(
      'DatabaseTestHelper not initialized. Call initializeTestDatabase() first.',
    );
  }
  return dbHelper;
}

export function getDataSource(): DataSource {
  if (!dataSource || !dataSource.isInitialized) {
    throw new Error(
      'DataSource not initialized. Call initializeTestDatabase() first.',
    );
  }
  return dataSource;
}

export async function closeTestDatabase(): Promise<void> {
  if (dataSource && dataSource.isInitialized) {
    await dataSource.destroy();
    dataSource = null;
    dbHelper = null;
  }
}

export async function cleanDatabase(): Promise<void> {
  const helper = getDbHelper();
  await helper.cleanDatabase(CLEANUP_ORDER);
}

export async function withTransaction<T>(
  fn: (
    manager: ReturnType<DataSource['createQueryRunner']>['manager'],
  ) => Promise<T>,
): Promise<T> {
  const helper = getDbHelper();
  return helper.inNewTransaction(fn);
}

export function createFactoryManager(): FactoryManager {
  return new FactoryManager(getDataSource());
}

export interface CreateTestModuleOptions {
  imports?: ModuleImport[];
  controllers?: Type<unknown>[];
  providers?: Provider[];
}

export function createTestModuleBuilder(
  options: CreateTestModuleOptions = {},
): TestingModuleBuilder {
  const { imports = [], controllers = [], providers = [] } = options;

  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: ['.ci.env', '.env'],
        load: allConfigs,
      }),
      TypeOrmModule.forRootAsync({
        useFactory: () => TestDataSource.options,
        dataSourceFactory: () => Promise.resolve(getDataSource()),
      }),
      LoggerModule,
      JwtModule.register({
        secret: TEST_JWT_SECRET,
        signOptions: { expiresIn: '1h' },
      }),
      ...imports,
    ],
    controllers,
    providers,
  });
}

export async function createTestModule(
  options: CreateTestModuleOptions = {},
): Promise<TestingModule> {
  return createTestModuleBuilder(options).compile();
}
