import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BotsModule } from './modules/bots/bots.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Bull Queue (Redis)
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
    }),

    // Modules
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    BotsModule,
    WhatsappModule,
    GatewayModule,
    SubscriptionsModule,
    AdminModule,
  ],
})
export class AppModule {}
