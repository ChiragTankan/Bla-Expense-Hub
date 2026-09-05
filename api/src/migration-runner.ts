import { DataSource } from 'typeorm';
import * as path from 'path';
import { MigrationCore } from '@gskglobal/nestjs-migrations';
import { parseNodeEnv, Environment } from './Environment';
import * as fs from 'fs';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import databaseConfig from './config/database.config';

// Create separate directories
const baseLogsDir = path.join(process.cwd(), 'logs');
const appLogsDir = path.join(baseLogsDir, 'app');
const errorLogsDir = path.join(baseLogsDir, 'errors');

[baseLogsDir, appLogsDir, errorLogsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    // App logs
    new winston.transports.DailyRotateFile({
      dirname: appLogsDir,
      filename: 'app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json(),
      ),
      maxSize: '5m',
      maxFiles: '30d',
      utc: false,
    }),
    // Error logs
    new winston.transports.DailyRotateFile({
      dirname: errorLogsDir,
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json(),
      ),
      maxSize: '5m',
      maxFiles: '30d',
      utc: false,
    }),
  ],
});

/**
 * Load environment configuration files in the correct order
 */
async function loadEnvironment(): Promise<void> {
  const dotenv = await import('dotenv');
  const nodeEnv = parseNodeEnv(process.env.NODE_ENV || '');

  // Load base configuration first
  dotenv.config({ path: '.env' });

  // Then load environment-specific config to override
  dotenv.config({ path: `.${nodeEnv}.env`, override: true });

  // For development, also load .env.local if it exists
  if (nodeEnv === Environment.Development) {
    dotenv.config({ path: '.env.local', override: true });
  }
}

/**
 * Create a DataSource from the app's database config
 */
function createDataSource(): DataSource {
  const dbConfig = databaseConfig();

  return new DataSource({
    type: dbConfig.type as 'mssql',
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    username: dbConfig.username,
    password: dbConfig.password,
    options: dbConfig.options,
    extra: dbConfig.extra,
  });
}

async function main() {
  const nodeEnv = parseNodeEnv(process.env.NODE_ENV || '');
  logger.info(`🚀 Starting migration runner...`);
  logger.info(
    `📁 Migrations directory: ${path.join(__dirname, '../migrations')}`,
  );
  logger.info(`🌍 Environment: ${nodeEnv}`);

  try {
    await loadEnvironment();
    const dataSource = createDataSource();

    // Log connection details
    const dbName = String(dataSource.options.database ?? 'unknown');
    logger.info(`🗄️  Database: ${dbName}`);
    const options = dataSource.options as { host?: string; port?: number };
    const host = options.host ?? 'unknown';
    const port = options.port ?? 0;
    logger.info(`🌐 Host: ${host}:${port}`);

    await dataSource.initialize();
    logger.info('Database connection established');

    const migrationCore = new MigrationCore(dataSource, {
      migrationsDir: path.join(__dirname, '../migrations'),
    });
    const result = await migrationCore.runMigrations({ verbose: true });

    if (result.success) {
      logger.info(`✅ Migration runner completed successfully!`);
    }

    await dataSource.destroy();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('❌ Migration runner failed:', error);
    process.exit(1);
  }
}

void main();
