import { registerAs } from '@nestjs/config';
import { parseNodeEnv, Environment } from '../Environment';

export interface LoggerConfig {
  level: string;
  transports: {
    console: boolean;
    file: boolean;
    appinsights: boolean;
  };
  appInsightsConnectionString?: string;
}

export default registerAs('logger', (): LoggerConfig => {
  const nodeEnv = parseNodeEnv(process.env.NODE_ENV ?? '');
  const isDevelopment = nodeEnv === Environment.Development;
  const isTestOrProduction =
    nodeEnv === Environment.Test || nodeEnv === Environment.Production;

  // Parse transports from env or use defaults
  const transportsEnv = process.env.LOG_TRANSPORTS;
  let transports: LoggerConfig['transports'];

  if (transportsEnv) {
    const enabledTransports = transportsEnv
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    transports = {
      console: enabledTransports.includes('console'),
      file: enabledTransports.includes('file'),
      appinsights: enabledTransports.includes('appinsights'),
    };

    // App Insights auto-collects from console, so enable console if appinsights is enabled
    if (transports.appinsights && !transports.console) {
      transports.console = true;
    }
  } else {
    // Defaults based on environment
    if (isDevelopment) {
      transports = { console: true, file: true, appinsights: false };
    } else if (isTestOrProduction) {
      transports = { console: true, file: false, appinsights: true };
    } else {
      // CI or unknown
      transports = { console: true, file: false, appinsights: false };
    }
  }

  return {
    level: process.env.LOG_LEVEL ?? 'info',
    transports,
    appInsightsConnectionString:
      process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  };
});
