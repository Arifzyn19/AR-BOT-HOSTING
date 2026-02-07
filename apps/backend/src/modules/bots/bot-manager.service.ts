import { Injectable, Logger } from '@nestjs/common';
import { BotStatus } from '@prisma/client';
import { BotsService } from './bots.service';
import { BaileysClientService } from '../whatsapp/baileys-client.service';

interface BotInstance {
  id: string;
  status: BotStatus;
  qrCode?: string;
}

@Injectable()
export class BotManagerService {
  private readonly logger = new Logger(BotManagerService.name);
  private readonly bots = new Map<string, BotInstance>();

  constructor(
    private botsService: BotsService,
    private baileysClient: BaileysClientService
  ) {}

  async startBot(botId: string, connectionType: 'pairing' | 'qr' = 'pairing') {
    this.logger.log(`Starting bot: ${botId} with ${connectionType} connection`);

    try {
      // Check if bot already running
      if (this.bots.has(botId)) {
        return { message: 'Bot already running', botId };
      }

      // Create bot instance
      const botInstance: BotInstance = {
        id: botId,
        status: BotStatus.CONNECTING,
      };

      this.bots.set(botId, botInstance);

      // Update status in database
      await this.botsService.updateStatus(botId, BotStatus.CONNECTING);

      // Initialize Baileys client with connection type
      const usePairing = connectionType === 'pairing';
      await this.baileysClient.createConnection(botId, usePairing);

      this.logger.log(`Bot ${botId} started successfully with ${connectionType}`);

      return {
        message: 'Bot started successfully',
        botId,
        status: BotStatus.CONNECTING,
        connectionType,
      };
    } catch (error) {
      this.logger.error(`Failed to start bot ${botId}:`, error);
      await this.botsService.updateStatus(botId, BotStatus.ERROR);
      throw error;
    }
  }

  async stopBot(botId: string) {
    this.logger.log(`Stopping bot: ${botId}`);

    try {
      const botInstance = this.bots.get(botId);

      if (!botInstance) {
        return { message: 'Bot not running', botId };
      }

      // Disconnect Baileys client
      await this.baileysClient.disconnect(botId);

      this.bots.delete(botId);
      await this.botsService.updateStatus(botId, BotStatus.DISCONNECTED);

      this.logger.log(`Bot ${botId} stopped successfully`);

      return {
        message: 'Bot stopped successfully',
        botId,
        status: BotStatus.DISCONNECTED,
      };
    } catch (error) {
      this.logger.error(`Failed to stop bot ${botId}:`, error);
      throw error;
    }
  }

  async restartBot(botId: string, connectionType: 'pairing' | 'qr' = 'pairing') {
    this.logger.log(`Restarting bot: ${botId}`);
    await this.stopBot(botId);
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
    return this.startBot(botId, connectionType);
  }

  async getQRCode(botId: string) {
    const qrCode = this.baileysClient.getQRCode(botId);
    const pairingCode = this.baileysClient.getPairingCode(botId);
    const bot = await this.botsService.findOneById(botId);

    return {
      botId,
      qrCode: pairingCode || qrCode || bot?.qrCode || null,
      status: this.bots.get(botId)?.status || bot?.status || BotStatus.DISCONNECTED,
    };
  }

  getBotInstance(botId: string): BotInstance | undefined {
    return this.bots.get(botId);
  }

  getAllRunningBots(): string[] {
    return Array.from(this.bots.keys());
  }

  isConnected(botId: string): boolean {
    return this.baileysClient.isConnected(botId);
  }
  
  async reloadPlugins(botId: string) {
    this.logger.log(`Reloading plugins for bot: ${botId}`);
    // Reload will be handled by PluginHandler via WhatsApp module
    return {
      message: 'Plugins reloaded successfully',
      botId,
    };
  }
}