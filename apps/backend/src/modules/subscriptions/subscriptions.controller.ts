import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface RequestWithUser {
  user: {
    id: string;
  };
}

@ApiTags('Subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current subscription' })
  async getMySubscription(@Request() req: RequestWithUser) {
    return this.subscriptionsService.getSubscription(req.user.id);
  }

  @Get('limits')
  @ApiOperation({ summary: 'Check subscription limits' })
  async checkLimits(@Request() req: RequestWithUser) {
    return this.subscriptionsService.checkLimits(req.user.id);
  }
}
