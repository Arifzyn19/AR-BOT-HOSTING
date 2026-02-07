import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { BotsController } from './bots.controller';
import { BotsService } from './bots.service';
import { BotManagerService } from './bot-manager.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'bot-queue',
    }),
    WhatsappModule,
  ],
  controllers: [BotsController],
  providers: [BotsService, BotManagerService],
  exports: [BotsService, BotManagerService],
})
export class BotsModule {}
