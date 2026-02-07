// User Types
export enum UserRole {
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface User {
  id: string;
  email: string;
  username?: string;
  name?: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  lastLogin?: Date;
}

// Bot Types
export enum BotStatus {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  QR_REQUIRED = 'QR_REQUIRED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
}

export interface Bot {
  id: string;
  name: string;
  phoneNumber: string;
  userId: string;
  status: BotStatus;
  isActive: boolean;
  totalMessages: number;
  totalCommands: number;
  totalGroups: number;
  qrCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Subscription Types
export interface Subscription {
  id: string;
  userId: string;
  plan: UserRole;
  isActive: boolean;
  maxBots: number;
  maxGroups: number;
  dailyMessages: number;
  dailyCommands: number;
  startDate: Date;
  endDate?: Date;
}

// Message Types
export interface Message {
  id: string;
  botId: string;
  messageId: string;
  from: string;
  to?: string;
  isGroup: boolean;
  type: string;
  content: string;
  timestamp: Date;
}

// WebSocket Events
export interface SocketEvents {
  'bot:status': { botId: string; status: BotStatus };
  'bot:message': { botId: string; message: Message };
  'bot:qr': { botId: string; qrCode: string };
  'bot:log': { botId: string; log: unknown };
}
