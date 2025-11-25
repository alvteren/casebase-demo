/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
    });
    const configService = app.get(ConfigService);
    const globalPrefix = 'api';
    app.setGlobalPrefix(globalPrefix);
    
    // Enable CORS for frontend
    const frontendUrl = configService.get('FRONTEND_URL');
    const allowedOrigins = frontendUrl.split(',').map(url => url.trim());
    app.enableCors({
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });
    
    const port = configService.get('PORT') || 3000;
    await app.listen(port);
    Logger.log(
      `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
    );
    Logger.warn(
      `⚠️  Note: If MongoDB is not running, chat history features will not work.`
    );
  } catch (error) {
    Logger.error('Failed to start application', error);
    process.exit(1);
  }
}

bootstrap();
