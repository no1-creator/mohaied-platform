import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // رفع حد حجم البيانات للسماح بصور الإعلانات الكبيرة
  app.use(json({ limit: '12mb' }));
  app.use(urlencoded({ extended: true, limit: '12mb' }));

  // Global prefix لكل المسارات
  app.setGlobalPrefix('api');

  // تفعيل الـ CORS للموقع والتطبيق
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // التحقق التلقائي من البيانات الواردة
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`🚀 Mohaied API is running on: http://localhost:${port}/api`);
}

bootstrap();
