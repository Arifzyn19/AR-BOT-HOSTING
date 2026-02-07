import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BotsService } from './bots.service';
import { BotManagerService } from './bot-manager.service';
import { CreateBotDto, UpdateBotDto, BotSettingsDto } from './dto/bot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface RequestWithUser {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('Bots')
@Controller('bots')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BotsController {
  constructor(
    private botsService: BotsService,
    private botManager: BotManagerService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create new bot' })
  async create(@Request() req: RequestWithUser, @Body() dto: CreateBotDto) {
    return this.botsService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user bots' })
  async findAll(@Request() req: RequestWithUser) {
    return this.botsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bot by ID' })
  async findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.botsService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update bot' })
  async update(@Request() req: RequestWithUser, @Param('id') id: string, @Body() dto: UpdateBotDto) {
    return this.botsService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete bot' })
  async delete(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.botsService.delete(req.user.id, id);
  }

  @Patch(':id/settings')
  @ApiOperation({ summary: 'Update bot settings' })
  async updateSettings(@Request() req: RequestWithUser, @Param('id') id: string, @Body() dto: BotSettingsDto) {
    return this.botsService.updateSettings(req.user.id, id, dto);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start bot' })
  async startBot(
    @Request() req: RequestWithUser, 
    @Param('id') id: string,
    @Body() body?: { connectionType?: 'pairing' | 'qr' }
  ) {
    await this.botsService.findOne(req.user.id, id); // Verify ownership
    const connectionType = body?.connectionType || 'pairing'; // Default to pairing
    return this.botManager.startBot(id, connectionType);
  }

  @Post(':id/stop')
  @ApiOperation({ summary: 'Stop bot' })
  async stopBot(@Request() req: RequestWithUser, @Param('id') id: string) {
    await this.botsService.findOne(req.user.id, id); // Verify ownership
    return this.botManager.stopBot(id);
  }

  @Post(':id/restart')
  @ApiOperation({ summary: 'Restart bot' })
  async restartBot(@Request() req: RequestWithUser, @Param('id') id: string) {
    await this.botsService.findOne(req.user.id, id); // Verify ownership
    return this.botManager.restartBot(id);
  }

  @Get(':id/qr')
  @ApiOperation({ summary: 'Get QR code for bot authentication' })
  async getQRCode(@Request() req: RequestWithUser, @Param('id') id: string) {
    await this.botsService.findOne(req.user.id, id); // Verify ownership
    return this.botManager.getQRCode(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get bot statistics' })
  async getStats(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.botsService.getStats(req.user.id, id);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get bot logs' })
  async getLogs(@Request() req: RequestWithUser, @Param('id') id: string, @Query('limit') limit?: string) {
    return this.botsService.getLogs(req.user.id, id, limit ? parseInt(limit) : 100);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get bot messages' })
  async getMessages(@Request() req: RequestWithUser, @Param('id') id: string, @Query('limit') limit?: string) {
    await this.botsService.findOne(req.user.id, id); // Verify ownership
    return this.botsService.getMessages(id, limit ? parseInt(limit) : 50);
  }

  @Get(':id/commands')
  @ApiOperation({ summary: 'Get bot commands' })
  async getCommands(@Request() req: RequestWithUser, @Param('id') id: string) {
    await this.botsService.findOne(req.user.id, id);
    return this.botsService.getCommands(id);
  }

  @Patch(':id/commands/:commandId')
  @ApiOperation({ summary: 'Update command' })
  async updateCommand(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Param('commandId') commandId: string,
    @Body() data: { isActive?: boolean }
  ) {
    await this.botsService.findOne(req.user.id, id);
    return this.botsService.updateCommand(id, commandId, data);
  }

  @Post(':id/reload-plugins')
  @ApiOperation({ summary: 'Reload bot plugins' })
  async reloadPlugins(@Request() req: RequestWithUser, @Param('id') id: string) {
    await this.botsService.findOne(req.user.id, id);
    return this.botManager.reloadPlugins(id);
  }
}
