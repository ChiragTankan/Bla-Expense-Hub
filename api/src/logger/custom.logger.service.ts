import {
  Inject,
  Injectable,
  LoggerService,
  OnApplicationShutdown,
  Optional,
} from '@nestjs/common';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import * as path from 'path';
import * as loggerConfig from '../config/logger.config';

@Injectable()
export class LoggerCore implements OnApplicationShutdown {
  private static instance: LoggerCore;
  public readonly winstonLogger: winston.Logger;

  constructor(
    @Inject('LOGGER_CONFIG') private loggerConfig: loggerConfig.LoggerConfig,
  ) {
    // Singleton pattern - reuse existing instance if available
    if (LoggerCore.instance) {
      this.winstonLogger = LoggerCore.instance.winstonLogger;
      return;
    }

    this.winstonLogger = this.initializeLogger();
    LoggerCore.instance = this;
  }

  private initializeLogger(): winston.Logger {
    const config = this.loggerConfig;

    // Configure Winston transports
    const transports: winston.transport[] = [];

    if (config.transports.console) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.colorize(),
            winston.format.printf((info) => {
              const { timestamp, level, message, context, trace } = info;
              const traceStr =
                trace != null
                  ? typeof trace === 'string'
                    ? trace
                    : JSON.stringify(trace)
                  : '';
              return `${String(timestamp)} [${String(context)}] ${level}: ${String(message)}${traceStr ? `\n${traceStr}` : ''}`;
            }),
          ),
        }),
      );
    }

    if (config.transports.file) {
      transports.push(
        new DailyRotateFile({
          dirname: path.join(process.cwd(), 'logs'),
          filename: 'application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.json(),
          ),
        }),
      );

      transports.push(
        new DailyRotateFile({
          dirname: path.join(process.cwd(), 'logs'),
          filename: 'error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.json(),
          ),
        }),
      );
    }

    return winston.createLogger({
      level: config.level,
      transports,
    });
  }

  async onApplicationShutdown(): Promise<void> {
    const flushPromises: Promise<void>[] = [];

    flushPromises.push(
      new Promise<void>((resolve) => {
        this.winstonLogger.on('finish', () => resolve());
        this.winstonLogger.end();
      }),
    );

    await Promise.all(flushPromises);
  }
}

/**
 * Custom logger with per-class context support.
 * Use LoggerFactory.create('ClassName') to get a logger with specific context.
 */
@Injectable()
export class CustomLogger implements LoggerService {
  constructor(
    private readonly loggerCore: LoggerCore,
    @Optional() @Inject('LOGGER_CONTEXT') private context: string = 'App',
  ) {}

  /**
   * Create a child logger with a specific context.
   */
  forContext(context: string): CustomLogger {
    const childLogger = Object.create(this) as CustomLogger;
    childLogger.context = context;
    return childLogger;
  }

  log(message: string, context?: string) {
    const logContext = context || this.context;
    this.loggerCore.winstonLogger.info(message, { context: logContext });
  }

  error(message: string, trace?: string, context?: string) {
    const logContext = context || this.context;
    this.loggerCore.winstonLogger.error(message, {
      context: logContext,
      trace,
    });
  }

  warn(message: string, context?: string) {
    const logContext = context || this.context;
    this.loggerCore.winstonLogger.warn(message, { context: logContext });
  }

  debug(message: string, context?: string) {
    const logContext = context || this.context;
    this.loggerCore.winstonLogger.debug(message, { context: logContext });
  }

  verbose(message: string, context?: string) {
    const logContext = context || this.context;
    this.loggerCore.winstonLogger.verbose(message, { context: logContext });
  }
}

/**
 * Factory for creating loggers with specific context.
 * Inject this into services/controllers to create context-specific loggers.
 */
@Injectable()
export class LoggerFactory {
  constructor(private readonly customLogger: CustomLogger) {}

  /**
   * Create a logger with the specified context.
   * @param context - The context name (typically the class name)
   */
  create(context: string): CustomLogger {
    return this.customLogger.forContext(context);
  }
}
