import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // TEMP: allow all origins so your Vercel site can call the API.
  // (Tighten this later by listing your exact Vercel URL.)
  app.enableCors({ origin: true });

  // Use PORT from host, or 3001 locally.
  await app.listen(process.env.PORT || 3001);
  console.log('API running on http://localhost:' + (process.env.PORT || 3001));
}
bootstrap();
