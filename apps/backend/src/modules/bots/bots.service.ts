import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBotDto, UpdateBotDto, BotSettingsDto } from './dto/bot.dto';
import { BotStatus } from '@prisma/client';

@Injectable()
export class BotsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBotDto) {
    // Check if user already has a bot (1 user = 1 bot rule)
    const existingBot = await this.prisma.bot.findFirst({
      where: { userId, deletedAt: null },
    });

    if (existingBot) {
      throw new ForbiddenException('You already have a bot. Only one bot per user is allowed.');
    }

    // Check subscription limits (kept for future expansion)
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new ForbiddenException('No active subscription');
    }

    // Create bot
    const bot = await this.prisma.bot.create({
      data: {
        ...dto,
        userId,
        status: BotStatus.DISCONNECTED,
      },
      include: {
        settings: true,
      },
    });

    // Create default settings
    await this.prisma.botSettings.create({
      data: {
        botId: bot.id,
      },
    });

    return bot;
  }

  async findAll(userId: string) {
    return this.prisma.bot.findMany({
      where: { userId, deletedAt: null },
      include: {
        settings: true,
        _count: {
          select: {
            messages: true,
            commands: true,
            groups: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(userId: string, botId: string) {
    const bot = await this.prisma.bot.findFirst({
      where: {
        id: botId,
        userId,
        deletedAt: null,
      },
      include: {
        settings: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            messages: true,
            commands: true,
            groups: true,
          },
        },
      },
    });

    if (!bot) {
      throw new NotFoundException('Bot not found');
    }

    return bot;
  }

  async findOneById(botId: string) {
    return this.prisma.bot.findUnique({
      where: { id: botId },
      include: {
        settings: true,
      },
    });
  }

  async update(userId: string, botId: string, dto: UpdateBotDto) {
    await this.findOne(userId, botId); // Verify ownership

    return this.prisma.bot.update({
      where: { id: botId },
      data: dto,
      include: {
        settings: true,
      },
    });
  }

  async updateSettings(userId: string, botId: string, dto: BotSettingsDto) {
    await this.findOne(userId, botId); // Verify ownership

    return this.prisma.botSettings.upsert({
      where: { botId },
      create: {
        botId,
        ...dto,
      },
      update: dto,
    });
  }

  async updateStatus(botId: string, status: BotStatus, qrCode?: string) {
    return this.prisma.bot.update({
      where: { id: botId },
      data: {
        status,
        qrCode,
        lastSeen: status === BotStatus.CONNECTED ? new Date() : undefined,
      },
    });
  }

  async delete(userId: string, botId: string) {
    await this.findOne(userId, botId); // Verify ownership

    return this.prisma.bot.update({
      where: { id: botId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  async getStats(userId: string, botId: string) {
    const bot = await this.findOne(userId, botId);

    const [messagesCount, commandsCount, groupsCount] = await Promise.all([
      this.prisma.message.count({ where: { botId } }),
      this.prisma.command.count({ where: { botId } }),
      this.prisma.group.count({ where: { botId } }),
    ]);

    return {
      bot: {
        id: bot.id,
        name: bot.name,
        phoneNumber: bot.phoneNumber,
        status: bot.status,
      },
      stats: {
        totalMessages: messagesCount,
        totalCommands: commandsCount,
        totalGroups: groupsCount,
        dailyMessages: bot.dailyMessages,
        dailyCommands: bot.dailyCommands,
      },
    };
  }

  async getLogs(userId: string, botId: string, limit = 100) {
    await this.findOne(userId, botId); // Verify ownership

    return this.prisma.botLog.findMany({
      where: { botId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async getMessages(botId: string, limit = 50) {
    return this.prisma.message.findMany({
      where: { botId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }
  
  async getCommands(botId: string) {
    return this.prisma.command.findMany({
      where: { botId },
      orderBy: { name: 'asc' },
    });
  }

  async updateCommand(botId: string, commandId: string, data: any) {
    return this.prisma.command.update({
      where: { id: commandId, botId },
      data,
    });
  }
}