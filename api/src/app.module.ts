import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Environment, parseNodeEnv } from './Environment';
import { validate } from './config/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  addTransactionalDataSource,
  deleteDataSourceByName,
} from 'typeorm-transactional';

import { allConfigs } from './config';
import { MigrationModule } from '@gskglobal/nestjs-migrations';
import path from 'path';
import { MailerConfig } from './config/mailer.config';
import { EmailModule } from '@gskglobal/nestjs-email';
import { LoggerModule } from './logger/Logger.module';
// import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

function getEnvFiles(): string[] {
  const nodeEnv = parseNodeEnv(process.env.NODE_ENV ?? '');

  const envFiles: string[] = [];
  if (nodeEnv === Environment.Development) {
    envFiles.push('.env.local');
  }
  envFiles.push(`.${nodeEnv}.env`);
  envFiles.push('.env');

  return envFiles;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: allConfigs,
      envFilePath: getEnvFiles(),
      validate,
      expandVariables: true,
    }),
    LoggerModule,
    MigrationModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        migrationsDir: path.join(__dirname, '../migrations'),
        autoRun: config.get('AUTO_RUN_MIGRATIONS') === 'true',
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],

      useFactory: (configService: ConfigService) =>
        configService.get('database')!,

      inject: [ConfigService],

      // Critical: wrap DataSource for transactional support
      dataSourceFactory: async (options) => {
        if (!options) {
          throw new Error('TypeORM options are required');
        }

        const dataSource = new DataSource(options);
        if (!dataSource.isInitialized) await dataSource.initialize();

        // Safe registration for typeorm-transactional
        // In case of retries or hot reloads, the DataSource might already be added
        const name = (options as { name?: string }).name || 'default';
        deleteDataSourceByName(name);

        return addTransactionalDataSource({
          name,
          dataSource,
          patch: true,
        });
      },
    }),
    EmailModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = configService.get<MailerConfig>('mailer');
        const nodeEnv = parseNodeEnv(process.env.NODE_ENV ?? '');
        const isDevelopment =
          nodeEnv === Environment.Development || nodeEnv === Environment.CI;

        if (isDevelopment) {
          return {
            provider: 'smtp' as const,
            smtp: config?.transport,
            defaultFrom: config?.defaults?.from,
            imageCompression: { enabled: true, maxWidth: 1200, quality: 75 },
            verbose: true,
          };
        }

        return {
          provider: 'azure' as const,
          azure: config?.azure,
          imageCompression: { enabled: true, maxWidth: 1200, quality: 75 },
          verbose: true,
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: LoggingInterceptor,
    // },
  ],
})
export class AppModule {}
