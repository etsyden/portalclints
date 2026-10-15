import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { RequestType } from '@prisma/client';

export class CreateRequestDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(RequestType)
  type?: RequestType;
}