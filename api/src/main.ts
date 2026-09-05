import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import {
  initializeTransactionalContext,
  StorageDriver,
} from 'typeorm-transactional';

async function bootstrap() {
  initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useLogger(['error', 'warn', 'log']);
  const logger = new Logger('Bootstrap');
  const config = new DocumentBuilder()
    .setTitle('Errigal CRM API')
    .setDescription('API documentation for Errigal CRM NestJS App')
    .setVersion('1.0')
    .addBearerAuth(
      //  This enables the Bearer token input in Swagger UI
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT', // Optional: Just for UI display
        name: 'Authorization',
        in: 'header',
      },
      'access-token', // This name will be used to reference security
    )
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, documentFactory);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') ?? 8080;
  await app.listen(port);
  logger.log(`✅ Server is running on http://localhost:${port}`);
  logger.log(`📚 Swagger docs available at http://localhost:${port}/api-docs`);
}
void bootstrap();
