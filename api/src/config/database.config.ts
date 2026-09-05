import { registerAs } from '@nestjs/config';
import { parseNodeEnv, Environment } from '../Environment';

export interface DatabaseConfig {
  type: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  database: string;
  entities: any[];
  // migrations: string[];
  // migrationsRun: boolean;
  options: {
    encrypt: boolean;
    trustServerCertificate: boolean;
  };
  extra?: {
    authentication: {
      type: string;
    };
  };
}

export default registerAs('database', (): DatabaseConfig => {
  const nodeEnv = parseNodeEnv(process.env.NODE_ENV || '');
  const isAzureAuth =
    nodeEnv === Environment.Test || nodeEnv === Environment.Production;

  const dbConfig: DatabaseConfig = {
    type: 'mssql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    database: process.env.DB_DATABASE || 'messaging',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true',
      trustServerCertificate: true,
    },
    extra: undefined,
  };

  if (isAzureAuth) {
    dbConfig.extra = {
      authentication: {
        type: 'azure-active-directory-default',
      },
    };
  } else {
    dbConfig.username = process.env.DB_USERNAME || 'sa';
    dbConfig.password = process.env.DB_PASSWORD || '';
  }

  return dbConfig;
});
