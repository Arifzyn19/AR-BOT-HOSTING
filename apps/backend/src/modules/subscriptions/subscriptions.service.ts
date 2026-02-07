import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async getSubscription(userId: string) {
    return this.prisma.subscription.findUnique({
      where: { userId },
    });
  }

  async checkLimits(userId: string) {
    const subscription = await this.getSubscription(userId);
    const botsCount = await this.prisma.bot.count({ where: { userId } });

    return {
      subscription,
      usage: {
        bots: botsCount,
        maxBots: subscription?.maxBots || 0,
      },
      canCreateBot: botsCount < (subscription?.maxBots || 0),
    };
  }
}
