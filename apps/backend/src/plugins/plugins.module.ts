import { Module, OnModuleInit } from '@nestjs/common';
import { CommandLoader } from './services/command-loader.service';
import { CommandHandler } from './services/command-handler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WhatsappModule } from '../modules/whatsapp/whatsapp.module';

@Module({
  imports: [PrismaModule, WhatsappModule],
  providers: [CommandLoader, CommandHandler],
  exports: [CommandLoader, CommandHandler],
})
export class PluginsModule implements OnModuleInit {
  constructor(private commandLoader: CommandLoader) {}

  async onModuleInit() {
    await this.commandLoader.loadCommands();
  }
}
