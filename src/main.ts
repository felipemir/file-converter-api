import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.use(
    rateLimit({
      windowMs: configService.get<number>('RATE_LIMIT_WINDOW_MS'),
      max: configService.get<number>('RATE_LIMIT_MAX'),
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('File Converter API')
    .setDescription(
      'REST API for converting DOCX, Markdown, HTML and images into PDF files.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = configService.get<number>('PORT') ?? 3000;
  await app.listen(port);

  Logger.log(
    `🚀 File Converter API running at http://localhost:${port}`,
    'Bootstrap',
  );
  Logger.log(
    `📘 Swagger docs available at http://localhost:${port}/docs`,
    'Bootstrap',
  );
}

bootstrap();
