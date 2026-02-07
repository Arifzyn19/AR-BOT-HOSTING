-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('BASIC', 'PREMIUM', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "BotStatus" AS ENUM ('CONNECTING', 'CONNECTED', 'QR_REQUIRED', 'DISCONNECTED', 'ERROR');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "name" TEXT,
    "avatar" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'BASIC',
    "googleId" TEXT,
    "githubId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "UserRole" NOT NULL DEFAULT 'BASIC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxBots" INTEGER NOT NULL DEFAULT 1,
    "maxGroups" INTEGER NOT NULL DEFAULT 10,
    "dailyMessages" INTEGER NOT NULL DEFAULT 1000,
    "dailyCommands" INTEGER NOT NULL DEFAULT 100,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "renewalDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bots" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "BotStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "lastSeen" TIMESTAMP(3),
    "qrCode" TEXT,
    "qrCodeExpiry" TIMESTAMP(3),
    "sessionData" JSONB,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "totalCommands" INTEGER NOT NULL DEFAULT 0,
    "totalGroups" INTEGER NOT NULL DEFAULT 0,
    "dailyMessages" INTEGER NOT NULL DEFAULT 0,
    "dailyCommands" INTEGER NOT NULL DEFAULT 0,
    "lastResetDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "bots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_settings" (
    "id" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "autoReply" BOOLEAN NOT NULL DEFAULT false,
    "autoReplyMessage" TEXT,
    "commandPrefix" TEXT NOT NULL DEFAULT '!',
    "enableCommands" BOOLEAN NOT NULL DEFAULT true,
    "autoJoinGroups" BOOLEAN NOT NULL DEFAULT false,
    "autoLeaveGroups" BOOLEAN NOT NULL DEFAULT false,
    "notifyOnMessage" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnCommand" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnError" BOOLEAN NOT NULL DEFAULT true,
    "webhookUrl" TEXT,
    "webhookEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "groupId" TEXT,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "caption" TEXT,
    "mediaUrl" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "isFromMe" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "adminCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBotAdmin" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commands" (
    "id" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[],
    "description" TEXT,
    "response" TEXT NOT NULL,
    "responseType" TEXT NOT NULL DEFAULT 'text',
    "adminOnly" BOOLEAN NOT NULL DEFAULT false,
    "groupOnly" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_logs" (
    "id" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bot_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "users_githubId_key" ON "users"("githubId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "bots_phoneNumber_key" ON "bots"("phoneNumber");

-- CreateIndex
CREATE INDEX "bots_userId_idx" ON "bots"("userId");

-- CreateIndex
CREATE INDEX "bots_phoneNumber_idx" ON "bots"("phoneNumber");

-- CreateIndex
CREATE INDEX "bots_status_idx" ON "bots"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bot_settings_botId_key" ON "bot_settings"("botId");

-- CreateIndex
CREATE UNIQUE INDEX "messages_messageId_key" ON "messages"("messageId");

-- CreateIndex
CREATE INDEX "messages_botId_idx" ON "messages"("botId");

-- CreateIndex
CREATE INDEX "messages_messageId_idx" ON "messages"("messageId");

-- CreateIndex
CREATE INDEX "messages_timestamp_idx" ON "messages"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "groups_groupId_key" ON "groups"("groupId");

-- CreateIndex
CREATE INDEX "groups_botId_idx" ON "groups"("botId");

-- CreateIndex
CREATE INDEX "groups_groupId_idx" ON "groups"("groupId");

-- CreateIndex
CREATE INDEX "commands_botId_idx" ON "commands"("botId");

-- CreateIndex
CREATE UNIQUE INDEX "commands_botId_name_key" ON "commands"("botId", "name");

-- CreateIndex
CREATE INDEX "bot_logs_botId_idx" ON "bot_logs"("botId");

-- CreateIndex
CREATE INDEX "bot_logs_level_idx" ON "bot_logs"("level");

-- CreateIndex
CREATE INDEX "bot_logs_timestamp_idx" ON "bot_logs"("timestamp");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bots" ADD CONSTRAINT "bots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_settings" ADD CONSTRAINT "bot_settings_botId_fkey" FOREIGN KEY ("botId") REFERENCES "bots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_botId_fkey" FOREIGN KEY ("botId") REFERENCES "bots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_botId_fkey" FOREIGN KEY ("botId") REFERENCES "bots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commands" ADD CONSTRAINT "commands_botId_fkey" FOREIGN KEY ("botId") REFERENCES "bots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_logs" ADD CONSTRAINT "bot_logs_botId_fkey" FOREIGN KEY ("botId") REFERENCES "bots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
