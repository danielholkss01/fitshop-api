import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Allow your web app at http://localhost:3000 to call the API
  app.enableCors({ origin: ['http://localhost:3000'] });
  // Use port 3001 locally (Render/host may inject PORT later)
  await app.listen(process.env.PORT || 3001);
  console.log('API running on http://localhost:' + (process.env.PORT || 3001));
}
bootstrap();
