import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get platform overview' })
  async getOverview() {
    return this.adminService.getOverview();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  async getAllUsers(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getAllUsers(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20
    );
  }

  @Get('bots')
  @ApiOperation({ summary: 'Get all bots' })
  async getAllBots(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getAllBots(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20
    );
  }
}
