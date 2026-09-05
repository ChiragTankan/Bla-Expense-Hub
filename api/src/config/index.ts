import appConfig from './configuration';
import databaseConfig from './database.config';
import loggerConfig from './logger.config';
import mailerConfig from './mailer.config';

export { appConfig, databaseConfig, loggerConfig, mailerConfig };

/**
 * All application configuration loaders.
 * Used by both app.module.ts and test setup.
 */
export const allConfigs = [
  appConfig,
  databaseConfig,
  loggerConfig,
  mailerConfig,
];
