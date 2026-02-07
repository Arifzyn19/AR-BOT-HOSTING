import { Module, forwardRef } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { BaileysClientService } from './baileys-client.service';
import { GatewayModule } from '../gateway/gateway.module';
import { PluginHandler } from '../../plugins/plugin-handler.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    GatewayModule, 
    PrismaModule,
  ],
  providers: [
    WhatsappService, 
    BaileysClientService, 
    PluginHandler,
  ],
  exports: [
    WhatsappService, 
    BaileysClientService, 
    PluginHandler,
  ],
})
export class WhatsappModule {}
