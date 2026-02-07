import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaileysClientService } from '../modules/whatsapp/baileys-client.service';
import * as fs from 'fs';
import * as path from 'path';

export interface PluginContext {
  botId: string;
  from: string;
  sender: string;
  pushName: string;
  body: string;
  args: string[];
  command: string;
  prefix: string;
  isGroup: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isBotAdmin: boolean;
}

export interface Plugin {
  name: string;
  aliases?: string[];
  category: string;
  description: string;
  example?: string;
  execute: (ctx: PluginContext, baileys: BaileysClientService) => Promise<void>;
  // Settings from DB
  level?: number;
  cooldown?: number;
  limit?: string;
  groupOnly?: boolean;
  privateOnly?: boolean;
  adminOnly?: boolean;
  ownerOnly?: boolean;
  premiumOnly?: boolean;
}

@Injectable()
export class PluginHandler {
  private readonly logger = new Logger(PluginHandler.name);
  private plugins = new Map<string, Plugin>();
  private cooldowns = new Map<string, Map<string, number>>();

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => BaileysClientService))
    private baileys: BaileysClientService,
  ) {}

  async loadPlugins(): Promise<void> {
    this.logger.log('🔌 Loading plugins...');
    
    // Fix path: always use src/plugins in dev, dist/plugins in prod
    const isDev = process.env.NODE_ENV !== 'production';
    
    let pluginsDir = path.join(process.cwd(), 'commands');
    
    this.logger.log(`📂 Plugins directory: ${pluginsDir}`);
    
    // Check if directory exists
    if (!fs.existsSync(pluginsDir)) {
      this.logger.error(`❌ Plugins directory not found: ${pluginsDir}`);
      return;
    }

    // Auto-detect categories from folders
    const categories = fs.readdirSync(pluginsDir)
      .filter(item => {
        const itemPath = path.join(pluginsDir, item);
        return fs.statSync(itemPath).isDirectory();
      })
      .filter(item => item !== 'node_modules' && !item.startsWith('.'));

    this.logger.log(`📁 Found categories: ${categories.join(', ')}`);

    let loaded = 0;
    
    for (const category of categories) {
      const categoryPath = path.join(pluginsDir, category);
      
      const files = fs.readdirSync(categoryPath)
  .filter(f => f.endsWith('.js'))
  .length > 0
    ? fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'))
    : fs.readdirSync(categoryPath).filter(
        f => f.endsWith('.ts') && !f.endsWith('.d.ts')
      );

      this.logger.log(`📁 Loading ${files.length} plugins from ${category}`);

      for (const file of files) {
        try {
          const filePath = path.join(categoryPath, file);
          
          let plugin: Plugin;
          
          if (isDev) {
            const module = require(filePath);
            plugin = module.default || module;
          } else {
            // Production: normal require for .js files
            delete require.cache[require.resolve(filePath)];
            const module = require(filePath);
            plugin = module.default || module;
          }
          
          if (!plugin || !plugin.name) {
            this.logger.warn(`⚠️  Invalid plugin: ${category}/${file}`);
            continue;
          }

          this.plugins.set(plugin.name.toLowerCase(), plugin);
          
          // Register aliases
          if (plugin.aliases) {
            for (const alias of plugin.aliases) {
              this.plugins.set(alias.toLowerCase(), plugin);
            }
          }

          loaded++;
          this.logger.log(`✅ Loaded: ${plugin.name} [${category}]`);
        } catch (error) {
          this.logger.error(`❌ Failed to load ${category}/${file}:`, error.message);
        }
      }
    }

    this.logger.log(`📦 Loaded ${loaded} plugins`);
    
    // Auto-sync to database
    await this.syncPluginsToDatabase();
  }

  private async syncPluginsToDatabase(): Promise<void> {
    try {
      this.logger.log('🔄 Syncing plugins to database...');
      
      // Get all bots
      const bots = await this.prisma.bot.findMany({
        where: { deletedAt: null },
      });

      if (bots.length === 0) {
        this.logger.log('No bots found, skipping sync');
        return;
      }

      // Get unique plugins (not aliases)
      const uniquePlugins = new Map<string, Plugin>();
      this.plugins.forEach((plugin) => {
        uniquePlugins.set(plugin.name, plugin);
      });

      let synced = 0;

      for (const bot of bots) {
        for (const plugin of uniquePlugins.values()) {
          // Check if command exists
          const existing = await this.prisma.command.findFirst({
            where: {
              botId: bot.id,
              name: plugin.name,
            },
          });

          if (!existing) {
            // Create new command
            await this.prisma.command.create({
              data: {
                botId: bot.id,
                name: plugin.name,
                description: plugin.description,
                category: plugin.category,
                aliases: plugin.aliases || [],
                response: '', // Plugins use code, not static response
                responseType: 'plugin',
                isActive: true,
                adminOnly: plugin.adminOnly || false,
                groupOnly: plugin.groupOnly || false,
                level: 0,
                cooldown: 0,
                usageCount: 0,
              },
            });
            synced++;
            this.logger.log(`  ✅ Synced: ${plugin.name} for bot ${bot.name}`);
          }
        }
      }

      this.logger.log(`✅ Synced ${synced} commands to database`);
    } catch (error) {
      this.logger.error('Failed to sync plugins to database:', error);
    }
  }

  async handleMessage(
    botId: string,
    from: string,
    sender: string,
    pushName: string,
    message: string,
    isGroup: boolean,
  ): Promise<void> {
    try {
      const bot = await this.prisma.bot.findUnique({
        where: { id: botId },
        include: { settings: true },
      });

      if (!bot?.settings?.enableCommands) {
        return;
      }

      const prefix = bot.settings.commandPrefix || '!';

      if (!message.startsWith(prefix)) {
        return;
      }

      const body = message.slice(prefix.length).trim();
      const args = body.split(/\s+/);
      const commandName = args.shift()?.toLowerCase();

      if (!commandName) {
        return;
      }

      const plugin = this.plugins.get(commandName);

      if (!plugin) {
        return; // Command not found
      }

      // Check if command exists and active in DB
      const dbCommand = await this.prisma.command.findFirst({
        where: {
          botId,
          name: plugin.name,
          isActive: true,
        },
      });

      if (!dbCommand) {
        return; // Command disabled
      }

      // Build context
      const ctx: PluginContext = {
        botId,
        from,
        sender,
        pushName,
        body,
        args,
        command: commandName,
        prefix,
        isGroup,
        isOwner: false, // TODO: implement
        isAdmin: false, // TODO: implement
        isBotAdmin: false, // TODO: implement
      };

      // Check permissions
      if (!this.checkPermissions(plugin, ctx, dbCommand)) {
        await this.baileys.sendMessage(botId, from, '❌ You don\'t have permission to use this command.');
        return;
      }

      // Check cooldown
      const cooldownTime = this.checkCooldown(plugin.name, sender, dbCommand.cooldown || 0);
      if (cooldownTime > 0) {
        await this.baileys.sendMessage(
          botId,
          from,
          `⏱️ Cooldown: ${cooldownTime}s remaining`,
        );
        return;
      }

      // Execute plugin
      this.logger.log(`⚡ Executing: ${plugin.name} from ${pushName}`);
      
      await plugin.execute(ctx, this.baileys);

      // Update stats
      await this.prisma.command.update({
        where: { id: dbCommand.id },
        data: {
          usageCount: { increment: 1 },
          lastUsed: new Date(),
        },
      });

      await this.prisma.bot.update({
        where: { id: botId },
        data: {
          totalCommands: { increment: 1 },
        },
      });

      // Set cooldown
      if (dbCommand.cooldown) {
        this.setCooldown(plugin.name, sender);
      }
    } catch (error) {
      this.logger.error('Error handling command:', error);
      try {
        await this.baileys.sendMessage(botId, from, '❌ Command execution failed');
      } catch {}
    }
  }

  private checkPermissions(plugin: Plugin, ctx: PluginContext, dbCmd: any): boolean {
    if (plugin.groupOnly && !ctx.isGroup) return false;
    if (plugin.privateOnly && ctx.isGroup) return false;
    if (plugin.adminOnly && !ctx.isAdmin) return false;
    if (plugin.ownerOnly && !ctx.isOwner) return false;
    
    // Check DB level
    if (dbCmd.level > 0) {
      // TODO: implement level checking
    }

    return true;
  }

  private checkCooldown(command: string, userId: string, cooldown: number): number {
    if (cooldown === 0) return 0;

    if (!this.cooldowns.has(command)) {
      this.cooldowns.set(command, new Map());
    }

    const userCooldowns = this.cooldowns.get(command)!;
    const now = Date.now();
    const cooldownAmount = cooldown * 1000;

    if (userCooldowns.has(userId)) {
      const expirationTime = userCooldowns.get(userId)! + cooldownAmount;
      if (now < expirationTime) {
        return Math.ceil((expirationTime - now) / 1000);
      }
    }

    return 0;
  }

  private setCooldown(command: string, userId: string): void {
    if (!this.cooldowns.has(command)) {
      this.cooldowns.set(command, new Map());
    }
    this.cooldowns.get(command)!.set(userId, Date.now());
  }

  async reloadPlugins(): Promise<void> {
    this.plugins.clear();
    await this.loadPlugins();
  }

  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name.toLowerCase());
  }

  getAllPlugins(): Plugin[] {
    const unique = new Map<string, Plugin>();
    this.plugins.forEach((plugin) => {
      unique.set(plugin.name, plugin);
    });
    return Array.from(unique.values());
  }
}
