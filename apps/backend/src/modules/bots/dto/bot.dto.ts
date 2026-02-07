import { IsString, IsOptional, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBotDto {
  @ApiProperty({ example: 'My WhatsApp Bot' })
  @IsString()
  name: string;

  @ApiProperty({ example: '628123456789' })
  @IsPhoneNumber('ID')
  phoneNumber: string;
}

export class UpdateBotDto {
  @ApiProperty({ example: 'Updated Bot Name' })
  @IsString()
  @IsOptional()
  name?: string;
}

export class BotSettingsDto {
  @ApiProperty()
  @IsOptional()
  autoReply?: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  autoReplyMessage?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  commandPrefix?: string;

  @ApiProperty()
  @IsOptional()
  enableCommands?: boolean;

  @ApiProperty()
  @IsOptional()
  notifyOnMessage?: boolean;

  @ApiProperty()
  @IsOptional()
  notifyOnCommand?: boolean;

  @ApiProperty()
  @IsOptional()
  notifyOnError?: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  webhookUrl?: string;

  @ApiProperty()
  @IsOptional()
  webhookEnabled?: boolean;
}
