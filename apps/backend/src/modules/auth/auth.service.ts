import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        password: hashedPassword,
        name: dto.name,
        role: UserRole.BASIC,
      },
    });

    // Create default subscription
    await this.prisma.subscription.create({
      data: {
        userId: user.id,
        plan: UserRole.BASIC,
        maxBots: 1,
        maxGroups: 10,
        dailyMessages: 1000,
        dailyCommands: 100,
      },
    });

    // Generate tokens
    return this.generateTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(dto.email, dto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return this.generateTokens(user);
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  private async generateTokens(user: { 
    id: string; 
    email: string; 
    role: string; 
    username?: string | null; 
    name?: string | null;
  }): Promise<AuthResponseDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username || undefined,
        name: user.name || undefined,
        role: user.role,
      },
    };
  }

  async refreshToken(token: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify(token);
      
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
  
  async getUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }
  
  async validateOAuthUser(oauthUser: any): Promise<AuthResponseDto> {
    if (!oauthUser?.email) {
      throw new UnauthorizedException('Invalid OAuth user');
    }

    let user = await this.prisma.user.findUnique({
      where: { email: oauthUser.email },
    });

    // Kalau user belum ada → create
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: oauthUser.email,
          username: oauthUser.username ?? oauthUser.email.split('@')[0],
          name: oauthUser.name ?? oauthUser.displayName ?? null,
          role: UserRole.BASIC,
        },
      });

      // Buat subscription default
      await this.prisma.subscription.create({
        data: {
          userId: user.id,
          plan: UserRole.BASIC,
          maxBots: 1,
          maxGroups: 10,
          dailyMessages: 1000,
          dailyCommands: 100,
        },
      });
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return this.generateTokens(user);
  }
}
