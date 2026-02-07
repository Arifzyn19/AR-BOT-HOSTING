import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID')!,
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET')!,
      callbackURL:
        configService.get<string>('GITHUB_CALLBACK_URL') ??
        'http://localhost:3001/api/v1/auth/github/callback',
      scope: ['user:email'],
      // ❌ JANGAN ADA passReqToCallback
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ) {
    const { id, username, emails, photos } = profile;

    return {
      provider: 'github',
      providerId: id,
      email: emails?.[0]?.value ?? `${username}@github.local`,
      name: profile.displayName || username,
      username,
      avatar: photos?.[0]?.value,
    };
  }
}