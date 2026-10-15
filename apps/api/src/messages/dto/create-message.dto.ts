import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { MessageChannel, Visibility } from '@prisma/client';

export class CreateMessageDto {
  @IsString()
  @MinLength(1)
  text!: string;

  @IsOptional()
  @IsEnum(MessageChannel)
  channel?: MessageChannel;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @IsOptional()
  @IsString()
  contextType?: string;

  @IsOptional()
  @IsUUID()
  contextId?: string;

  @IsOptional()
  @IsUUID()
  replyToId?: string;
}