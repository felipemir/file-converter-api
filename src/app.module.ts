import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().default('1h'),
        AUTH_USER_EMAIL: Joi.string().email().required(),
        AUTH_USER_NAME: Joi.string().default('File Converter Admin'),
        AUTH_USER_PASSWORD: Joi.string().min(4).required(),
        RATE_LIMIT_MAX: Joi.number().default(20),
        RATE_LIMIT_WINDOW_MS: Joi.number().default(60 * 1000),
      }),
    }),
    AuthModule,
    FilesModule,
  ],
})
export class AppModule {}
