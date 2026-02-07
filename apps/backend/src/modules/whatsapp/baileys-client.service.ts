import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import { makeInMemoryStore } from "@rodrigogs/baileys-store"
import { Boom } from '@hapi/boom';
import * as QRCode from 'qrcode';
import NodeCache from 'node-cache';
import { EventsGateway } from '../gateway/events.gateway';
import { PrismaService } from '../../prisma/prisma.service';
import { BotStatus } from '@prisma/client';
import { PluginHandler } from '../../plugins/plugin-handler.service';
import pino from 'pino';

interface BotConnection {
  socket: WASocket;
  qrCode?: string;
  pairingCode?: string;
  status: BotStatus;
  groupCache: NodeCache;
}

@Injectable()
export class BaileysClientService implements OnModuleInit {
  private readonly logger = new Logger(BaileysClientService.name);
  private connections = new Map<string, BotConnection>();

  constructor(
    private prisma: PrismaService,
    private gateway: EventsGateway,
    @Inject(forwardRef(() => PluginHandler))
    private pluginHandler: PluginHandler,
  ) {}

  async onModuleInit() {
    // Load plugins when module initializes
    await this.pluginHandler.loadPlugins();
  }

  async createConnection(botId: string, usePairing = false): Promise<void> {
    try {
      this.logger.log(`Creating Baileys connection for bot: ${botId}, pairing: ${usePairing}`);

      const logger = pino({
      level: "fatal",
      timestamp: () => `,"time":"${new Date().toISOString()}\"`,
    }).child({ class: "client" })
    
      const store = makeInMemoryStore({
      logger: logger.child({ level: "silent" }),
    })
      // Get bot from database
      const bot = await this.prisma.bot.findUnique({
        where: { id: botId },
      });

      if (!bot) {
        throw new Error('Bot not found');
      }

      // Setup auth state
      const authFolder = `./auth_info_baileys/${botId}`;
      const { state, saveCreds } = await useMultiFileAuthState(authFolder);

      // Get latest Baileys version
      const { version, isLatest } = await fetchLatestBaileysVersion();
      this.logger.log(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

      // Setup group cache (5 minutes TTL)
      const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false });

      // Create socket with latest config
      const sock = makeWASocket({
        version,
        logger: logger.child({ level: "silent" }),
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, this.logger as any),
        },
        printQRInTerminal: false,
        generateHighQualityLinkPreview: true,
        cachedGroupMetadata: async (jid) => groupCache.get(jid) as any,
        markOnlineOnConnect: true,
        syncFullHistory: true,
        retryRequestDelayMs: 10,
        transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 10 },
        maxMsgRetryCount: 15,
        appStateMacVerification: {
          patch: true,
          snapshot: true,
        },
      });
      
      store.bind(sock.ev as any);
        
      // Store connection
      this.connections.set(botId, {
        socket: sock,
        status: BotStatus.CONNECTING,
        groupCache,
      });

      // Update bot status
      await this.prisma.bot.update({
        where: { id: botId },
        data: { status: BotStatus.CONNECTING },
      });

      // Generate pairing code with delay if using pairing
      if (usePairing && !sock.authState.creds.registered) {
        this.logger.log(`🔐 Will generate pairing code for bot: ${botId} in 3 seconds...`);
        
        // Use setTimeout but wrap in a way that doesn't block
        setTimeout(async () => {
          try {
            this.logger.log(`🔐 Generating pairing code for bot: ${botId}`);
            const phoneNumber = bot.phoneNumber.replace(/\D/g, '');
            const code = await sock.requestPairingCode(phoneNumber);
            
            this.logger.log(`✅ Pairing code generated: ${code}`);

            const botConnection = this.connections.get(botId);
            if (botConnection) {
              botConnection.pairingCode = code;
            }

            // Save to database
            await this.prisma.bot.update({
              where: { id: botId },
              data: {
                status: BotStatus.QR_REQUIRED,
                qrCode: code,
              },
            });

            // Emit events
            this.gateway.emitPairingCode(botId, code);
            this.gateway.emitBotStatus(botId, BotStatus.QR_REQUIRED);
            await this.createLog(botId, 'info', 'pairing_code_generated', `Pairing code: ${code}`);
          } catch (error) {
            this.logger.error(`❌ Failed to generate pairing code: ${error}`);
            await this.createLog(botId, 'error', 'pairing_failed', String(error));
          }
        }, 3000);
      }

      // Handle credentials update
      sock.ev.on('creds.update', saveCreds);

      // ✅ Handle messages FIRST - before connection.update
      this.logger.log('🎧 Registering message handler...');
      sock.ev.on('messages.upsert', async ({ type, messages }) => {
        this.logger.log(`📬 messages.upsert - Type: ${type}, Count: ${messages.length}`);
        
        if (type === 'notify') {
          for (const msg of messages) {
            this.logger.log(`📨 Message from: ${msg.key.remoteJid}, fromMe: ${msg.key.fromMe}`);
            
            if (!msg.key.fromMe && msg.message) {
              this.logger.log(`✅ Processing message...`);
              await this.handleMessage(botId, msg);
            }
          }
        }
      });
      this.logger.log('✅ Message handler registered');

      // Handle connection update
      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // Handle QR Code (if not using pairing)
        if (qr && !usePairing) {
          this.logger.log(`QR Code generated for bot: ${botId}`);
          const qrCodeDataUrl = await QRCode.toDataURL(qr);

          const botConnection = this.connections.get(botId);
          if (botConnection) {
            botConnection.qrCode = qrCodeDataUrl;
          }

          await this.prisma.bot.update({
            where: { id: botId },
            data: {
              status: BotStatus.QR_REQUIRED,
              qrCode: qrCodeDataUrl,
              qrCodeExpiry: new Date(Date.now() + 60000), // 1 minute
            },
          });

          this.gateway.emitQRCode(botId, qrCodeDataUrl);
          this.gateway.emitBotStatus(botId, BotStatus.QR_REQUIRED);
          await this.createLog(botId, 'info', 'qr_generated', 'QR Code generated');
        }

        // Handle Pairing Code
        if (!sock.authState.creds.registered && usePairing) {
          this.logger.log(`Requesting pairing code for bot: ${botId}`);
          try {
            const phoneNumber = bot.phoneNumber.replace(/\D/g, ''); // Remove non-digits
            const code = await sock.requestPairingCode(phoneNumber);
            
            this.logger.log(`✅ Pairing code for bot ${botId}: ${code}`);

            const botConnection = this.connections.get(botId);
            if (botConnection) {
              botConnection.pairingCode = code;
            }

            // Save to database
            await this.prisma.bot.update({
              where: { id: botId },
              data: {
                status: BotStatus.QR_REQUIRED,
                qrCode: code, // Store pairing code temporarily
              },
            });

            // Emit to frontend
            this.gateway.emitPairingCode(botId, code);
            this.gateway.emitBotStatus(botId, BotStatus.QR_REQUIRED);
            await this.createLog(botId, 'info', 'pairing_code_generated', `Pairing code: ${code}`);
          } catch (error) {
            this.logger.error(`Failed to request pairing code: ${error}`);
            await this.createLog(botId, 'error', 'pairing_failed', 'Failed to generate pairing code');
          }
        }

        // Handle connection close
        if (connection === 'close') {
          const shouldReconnect =
            (lastDisconnect?.error as Boom)?.output?.statusCode !==
            DisconnectReason.loggedOut;

          this.logger.log(`Bot ${botId} disconnected. Reconnect: ${shouldReconnect}`);

          if (shouldReconnect) {
            await this.prisma.bot.update({
              where: { id: botId },
              data: { status: BotStatus.DISCONNECTED },
            });
            this.gateway.emitBotStatus(botId, BotStatus.DISCONNECTED);
            await this.createLog(botId, 'warn', 'disconnected', 'Bot disconnected');
            
            // Reconnect after 5 seconds
            setTimeout(() => this.createConnection(botId, usePairing), 5000);
          } else {
            await this.prisma.bot.update({
              where: { id: botId },
              data: { status: BotStatus.DISCONNECTED, isActive: false },
            });
            this.connections.delete(botId);
            await this.createLog(botId, 'info', 'logged_out', 'Bot logged out');
          }
        } else if (connection === 'open') {
          this.logger.log(`✅ Bot ${botId} connected successfully`);

          await this.prisma.bot.update({
            where: { id: botId },
            data: {
              status: BotStatus.CONNECTED,
              isActive: true,
              lastSeen: new Date(),
              qrCode: null,
            },
          });

          this.gateway.emitBotStatus(botId, BotStatus.CONNECTED);
          await this.createLog(botId, 'info', 'connected', 'Bot connected successfully');
        }
      });

      // Handle group metadata updates
      sock.ev.on('groups.update', async (updates) => {
        for (const update of updates) {
          if (!update.id) continue; // Skip if no id
          
          try {
            const metadata = await sock.groupMetadata(update.id);
            groupCache.set(update.id, metadata);
            this.logger.log(`📦 Updated group cache for: ${update.id}`);
          } catch (error) {
            this.logger.error(`Failed to update group metadata: ${error}`);
          }
        }
      });

      // Handle group participants updates
      sock.ev.on('group-participants.update', async (event) => {
        try {
          const metadata = await sock.groupMetadata(event.id);
          groupCache.set(event.id, metadata);
          this.logger.log(`👥 Updated group participants cache for: ${event.id}`);
        } catch (error) {
          this.logger.error(`Failed to update group participants: ${error}`);
        }
      });
      
      this.logger.log(`✅ Baileys connection initialized for bot: ${botId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to create connection for bot ${botId}:`, error);
      await this.prisma.bot.update({
        where: { id: botId },
        data: { status: BotStatus.ERROR },
      });
      await this.createLog(
        botId,
        'error',
        'connection_failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  async disconnect(botId: string): Promise<void> {
    const connection = this.connections.get(botId);

    if (connection) {
      await connection.socket.logout();
      this.connections.delete(botId);
      this.logger.log(`Bot ${botId} disconnected and logged out`);
    }
  }

  async sendMessage(botId: string, to: string, message: string): Promise<void> {
    const connection = this.connections.get(botId);

    if (!connection) {
      this.logger.error(`❌ Bot ${botId} not found in connections`);
      throw new Error('Bot not connected');
    }

    if (!connection.socket) {
      this.logger.error(`❌ Bot ${botId} has no socket`);
      throw new Error('Bot socket not available');
    }

    try {
      // Handle new JID format (lid or s.whatsapp.net)
      const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
      
      this.logger.log(`📤 Sending message to ${jid}...`);
      
      await connection.socket.sendMessage(jid, { text: message });

      this.logger.log(`✅ Message sent successfully from bot ${botId} to ${to}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send message:`, error);
      throw error;
    }
  }

  getQRCode(botId: string): string | null {
    const connection = this.connections.get(botId);
    return connection?.qrCode || null;
  }

  getPairingCode(botId: string): string | null {
    const connection = this.connections.get(botId);
    return connection?.pairingCode || null;
  }

  isConnected(botId: string): boolean {
    const connection = this.connections.get(botId);
    return connection?.status === BotStatus.CONNECTED;
  }

  private async handleMessage(botId: string, msg: any) {
    try {
      // Handle new message format with lid addressing
      const from = msg.key.remoteJid || msg.key.remoteJidAlt || '';
      const isGroup = from.endsWith('@g.us');
      
      // Extract message content from various message types
      const messageContent =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption ||
        msg.message?.documentMessage?.caption ||
        '';

      // Get sender info
      const pushName = msg.pushName || 'Unknown';
      const messageType = Object.keys(msg.message || {})[0] || 'text';

      this.logger.log(`📨 New message from ${pushName} (${from}): ${messageContent.substring(0, 50)}...`);

      // Save to database
      await this.prisma.message.create({
        data: {
          botId,
          messageId: msg.key.id || '',
          from: isGroup ? from : (msg.key.remoteJidAlt || from),
          isGroup,
          type: messageType,
          content: messageContent,
          timestamp: new Date(Number(msg.messageTimestamp) * 1000),
        },
      });

      // Update bot stats
      await this.prisma.bot.update({
        where: { id: botId },
        data: {
          totalMessages: { increment: 1 },
          dailyMessages: { increment: 1 },
        },
      });

      // Emit to frontend
      this.gateway.emitNewMessage(botId, {
        from: pushName,
        content: messageContent,
        timestamp: new Date(),
      });

      // Check if it's a command - use PluginHandler
      const bot = await this.prisma.bot.findUnique({
        where: { id: botId },
        include: { settings: true },
      });

      if (bot?.settings?.enableCommands && messageContent.startsWith(bot.settings.commandPrefix)) {
        await this.pluginHandler.handleMessage(
          botId,
          from,
          from, // sender (for now, same as from)
          pushName,
          messageContent,
          isGroup
        );
      }
    } catch (error) {
      this.logger.error(`Error handling message for bot ${botId}:`, error);
    }
  }

  private async createLog(
    botId: string,
    level: string,
    event: string,
    message: string,
    metadata?: unknown
  ) {
    await this.prisma.botLog.create({
      data: {
        botId,
        level,
        event,
        message,
        metadata: metadata as never,
      },
    });

    this.gateway.emitLog(botId, { level, event, message, timestamp: new Date() });
  }
}
