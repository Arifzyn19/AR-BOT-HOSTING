import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, data: { name?: string; username?: string; avatar?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        role: true,
      },
    });
  }

  async getStats(userId: string) {
    const [botsCount, messagesCount] = await Promise.all([
      this.prisma.bot.count({ where: { userId } }),
      this.prisma.message.count({
        where: {
          bot: {
            userId,
          },
        },
      }),
    ]);

    return {
      botsCount,
      messagesCount,
    };
  }
}
