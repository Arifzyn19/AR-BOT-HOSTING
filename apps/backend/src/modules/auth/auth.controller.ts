import { Controller, Post, Body, UseGuards, Get, Request, Res, UseFilters } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: any;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refreshToken(@Body('refreshToken') refreshToken: string): Promise<AuthResponseDto> {
    return this.authService.refreshToken(refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  async getMe(@Request() req: RequestWithUser) {
    return this.authService.getUserById(req.user.id);
  }

  // Google OAuth
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth login' })
  async googleAuth() {
    // Initiates the Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Request() req: RequestWithUser, @Res() res: Response) {
    const authResponse = await this.authService.validateOAuthUser(req.user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    res.redirect(
      `${frontendUrl}/auth/callback?` +
      `accessToken=${authResponse.accessToken}&` +
      `refreshToken=${authResponse.refreshToken}`
    );
  }

  // GitHub OAuth
  @Get('github')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'GitHub OAuth login' })
  async githubAuth() {
    // Initiates the GitHub OAuth flow
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  async githubAuthCallback(@Request() req: RequestWithUser, @Res() res: Response) {
    const authResponse = await this.authService.validateOAuthUser(req.user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    res.redirect(
      `${frontendUrl}/auth/callback?` +
      `accessToken=${authResponse.accessToken}&` +
      `refreshToken=${authResponse.refreshToken}`
    );
  }
}
