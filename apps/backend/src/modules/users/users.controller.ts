import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface RequestWithUser {
  user: {
    id: string;
  };
}

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  async getProfile(@Request() req: RequestWithUser) {
    return this.usersService.findById(req.user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(
    @Request() req: RequestWithUser,
    @Body() data: { name?: string; username?: string; avatar?: string }
  ) {
    return this.usersService.updateProfile(req.user.id, data);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  async getStats(@Request() req: RequestWithUser) {
    return this.usersService.getStats(req.user.id);
  }
}
