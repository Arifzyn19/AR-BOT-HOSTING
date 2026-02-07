import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CommandLoader } from './command-loader.service';
import { CommandContext } from '../types/command.types';
import { BaileysClientService } from '../../modules/whatsapp/baileys-client.service';

@Injectable()
export class CommandHandler {
  private readonly logger = new Logger(CommandHandler.name);
  private cooldowns = new Map<string, Map<string, number>>(); // commandName -> userId -> timestamp

  constructor(
    private prisma: PrismaService,
    private commandLoader: CommandLoader,
    private baileysClient: BaileysClientService,
  ) {}

  async handleCommand(
    botId: string,
    from: string,
    sender: string,
    message: string,
    isGroup: boolean,
  ): Promise<void> {
    try {
      // Get bot settings
      const bot = await this.prisma.bot.findUnique({
        where: { id: botId },
        include: { settings: true },
      });

      if (!bot || !bot.settings?.enableCommands) {
        return;
      }

      const prefix = bot.settings.commandPrefix || '!';

      // Check if message starts with prefix
      if (!message.startsWith(prefix)) {
        return;
      }

      // Parse command and args
      const args = message.slice(prefix.length).trim().split(/\s+/);
      const commandName = args.shift()?.toLowerCase();

      if (!commandName) {
        return;
      }

      // Get command
      const command = this.commandLoader.getCommand(commandName);

      if (!command) {
        return; // Command not found, silently ignore
      }

      // Check if command is active in database
      const dbCommand = await this.prisma.command.findFirst({
        where: {
          botId,
          name: command.config.name,
          isActive: true,
        },
      });

      if (!dbCommand) {
        return; // Command disabled in database
      }

      // Check permissions
      const hasPermission = await this.checkPermissions(
        botId,
        sender,
        isGroup,
        command.config,
      );

      if (!hasPermission) {
        await this.sendMessage(botId, from, '❌ You don\'t have permission to use this command.');
        return;
      }

      // Check cooldown
      const onCooldown = this.checkCooldown(commandName, sender, command.config.cooldown || 0);

      if (onCooldown > 0) {
        await this.sendMessage(
          botId,
          from,
          `⏱️ Please wait ${onCooldown} seconds before using this command again.`,
        );
        return;
      }

      // Create context
      const context: CommandContext = {
        botId,
        from,
        sender,
        isGroup,
        groupId: isGroup ? from : undefined,
        args,
        fullText: args.join(' '),
        reply: async (text: string) => {
          await this.sendMessage(botId, from, text);
        },
        react: async (emoji: string) => {
          // TODO: Implement reaction
          this.logger.log(`React with ${emoji} to message from ${from}`);
        },
      };

      // Execute command
      this.logger.log(`⚡ Executing command: ${commandName} from ${sender}`);
      await command.execute(context);

      // Update usage stats
      await this.updateCommandStats(botId, dbCommand.id);

      // Set cooldown
      if (command.config.cooldown) {
        this.setCooldown(commandName, sender);
      }
    } catch (error) {
      this.logger.error(`Error handling command:`, error);
      try {
        await this.sendMessage(botId, from, '❌ An error occurred while executing the command.');
      } catch (sendError) {
        this.logger.error('Failed to send error message:', sendError);
      }
    }
  }

  private async checkPermissions(
    botId: string,
    sender: string,
    isGroup: boolean,
    config: any,
  ): Promise<boolean> {
    // Group only check
    if (config.groupOnly && !isGroup) {
      return false;
    }

    // Private only check
    if (config.privateOnly && isGroup) {
      return false;
    }

    // Level-based permission
    if (config.level === 0) {
      return true; // Everyone can use
    }

    // TODO: Implement role/level checking
    // For now, allow all non-restricted commands
    if (config.ownerOnly) {
      // Check if sender is bot owner
      const bot = await this.prisma.bot.findUnique({
        where: { id: botId },
        include: { user: true },
      });
      return false; // Implement owner check
    }

    if (config.adminOnly) {
      // Check if sender is admin
      return false; // Implement admin check
    }

    return true;
  }

  private checkCooldown(commandName: string, userId: string, cooldownSeconds: number): number {
    if (cooldownSeconds === 0) {
      return 0;
    }

    if (!this.cooldowns.has(commandName)) {
      this.cooldowns.set(commandName, new Map());
    }

    const commandCooldowns = this.cooldowns.get(commandName)!;
    const now = Date.now();
    const cooldownAmount = cooldownSeconds * 1000;

    if (commandCooldowns.has(userId)) {
      const expirationTime = commandCooldowns.get(userId)! + cooldownAmount;

      if (now < expirationTime) {
        return Math.ceil((expirationTime - now) / 1000);
      }
    }

    return 0;
  }

  private setCooldown(commandName: string, userId: string): void {
    if (!this.cooldowns.has(commandName)) {
      this.cooldowns.set(commandName, new Map());
    }

    this.cooldowns.get(commandName)!.set(userId, Date.now());
  }

  private async sendMessage(botId: string, to: string, message: string): Promise<void> {
    await this.baileysClient.sendMessage(botId, to, message);
  }

  private async updateCommandStats(botId: string, commandId: string): Promise<void> {
    await this.prisma.command.update({
      where: { id: commandId },
      data: {
        usageCount: { increment: 1 },
        lastUsed: new Date(),
      },
    });
  }
}
