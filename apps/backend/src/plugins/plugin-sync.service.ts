import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PluginHandler } from './plugin-handler.service';

@Injectable()
export class PluginSyncService {
  private readonly logger = new Logger(PluginSyncService.name);

  constructor(
    private prisma: PrismaService,
    private pluginHandler: PluginHandler,
  ) {}

  async syncPluginsToDatabase(botId: string): Promise<void> {
    this.logger.log(`🔄 Syncing plugins to database for bot: ${botId}`);

    const plugins = this.pluginHandler.getAllPlugins();
    
    this.logger.log("Sync :", plugins)
    
    let synced = 0;

    for (const plugin of plugins) {
      try {
        // Check if command exists
        const existing = await this.prisma.command.findFirst({
          where: {
            botId,
            name: plugin.name,
          },
        });

        if (existing) {
          // Update existing
          await this.prisma.command.update({
            where: { id: existing.id },
            data: {
              description: plugin.description,
              category: plugin.category,
              aliases: plugin.aliases || [],
              example: plugin.example || '',
            },
          });
          this.logger.log(`✅ Updated: ${plugin.name}`);
        } else {
          // Create new
          await this.prisma.command.create({
            data: {
              botId,
              name: plugin.name,
              description: plugin.description,
              category: plugin.category,
              aliases: plugin.aliases || [],
              example: plugin.example || '',
              response: `Command ${plugin.name} executed`,
              responseType: 'text',
              isActive: true,
              adminOnly: plugin.adminOnly || false,
              groupOnly: plugin.groupOnly || false,
              level: plugin.level ?? 0,       
              cooldown: plugin.cooldown ?? 0,
              usageCount: 0,
            },
          });
          this.logger.log(`➕ Created: ${plugin.name}`);
          synced++;
        }
      } catch (error) {
        this.logger.error(`Failed to sync ${plugin.name}:`, error.message);
      }
    }

    this.logger.log(`✨ Synced ${synced} new plugins to database`);
  }

  async syncAllBots(): Promise<void> {
    const bots = await this.prisma.bot.findMany({
      where: { deletedAt: null },
    });

    for (const bot of bots) {
      await this.syncPluginsToDatabase(bot.id);
    }
  }
}
