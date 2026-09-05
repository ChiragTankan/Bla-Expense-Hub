import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  CustomLogger,
  LoggerCore,
  LoggerFactory,
} from './custom.logger.service';
import { LoggerConfig } from '../config/logger.config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'LOGGER_CONTEXT',
      useValue: 'App',
    },
    {
      provide: 'LOGGER_CONFIG',
      useFactory: (configService: ConfigService): LoggerConfig =>
        configService.get<LoggerConfig>('logger')!,
      inject: [ConfigService],
    },
    LoggerCore,
    CustomLogger,
    LoggerFactory,
  ],
  exports: [CustomLogger, LoggerFactory],
})
export class LoggerModule {}
