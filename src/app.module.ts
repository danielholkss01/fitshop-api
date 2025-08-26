import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { OutfitsController } from './outfits.controller';

@Module({
  imports: [],
  controllers: [AppController, HealthController, OutfitsController],
  providers: [AppService],
})
export class AppModule {}
