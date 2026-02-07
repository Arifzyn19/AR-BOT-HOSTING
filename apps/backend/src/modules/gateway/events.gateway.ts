import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Emit bot status update
  emitBotStatus(botId: string, status: string) {
    this.server.emit('bot:status', { botId, status });
  }

  // Emit new message received
  emitNewMessage(botId: string, message: unknown) {
    this.server.emit('bot:message', { botId, message });
  }

  // Emit QR code update
  emitQRCode(botId: string, qrCode: string) {
    this.server.emit('bot:qr', { botId, qrCode });
  }

  // Emit pairing code
  emitPairingCode(botId: string, pairingCode: string) {
    this.server.emit('bot:pairing-code', { botId, pairingCode });
  }

  // Emit bot logs
  emitLog(botId: string, log: unknown) {
    this.server.emit('bot:log', { botId, log });
  }
}
