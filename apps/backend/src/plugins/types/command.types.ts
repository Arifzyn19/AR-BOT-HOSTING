export interface CommandContext {
  botId: string;
  from: string;
  sender: string;
  isGroup: boolean;
  groupId?: string;
  args: string[];
  fullText: string;
  reply: (text: string) => Promise<void>;
  react: (emoji: string) => Promise<void>;
}

export interface CommandConfig {
  name: string;
  aliases?: string[];
  description: string;
  example?: string;
  category: 'admin' | 'group' | 'utility' | 'fun' | 'owner';
  level: number; // 0 = all, 1 = group admin, 2 = bot admin, 3 = owner
  cooldown?: number; // in seconds
  groupOnly?: boolean;
  privateOnly?: boolean;
  adminOnly?: boolean;
  ownerOnly?: boolean;
  premiumOnly?: boolean;
  limit?: number | string; // usage limit
  isActive: boolean;
}

export interface Command {
  config: CommandConfig;
  execute: (ctx: CommandContext) => Promise<void>;
}

export interface CommandModule {
  default: Command;
}
