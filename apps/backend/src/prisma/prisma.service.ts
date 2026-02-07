import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: ['query', 'error', 'warn'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Helper method untuk clean database (untuk testing)
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production!');
    }

    const models = Reflect.ownKeys(this)
      .filter((key): key is string => typeof key === 'string')
      .filter((key) => !key.startsWith('_'));
  
    return Promise.all(
      models.map((modelKey) => {
        // @ts-expect-error - Prisma dynamic model access
        return this[modelKey].deleteMany();
      })
    );
  }
}
