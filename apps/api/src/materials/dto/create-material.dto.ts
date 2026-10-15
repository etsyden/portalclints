import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { MaterialType, Visibility } from '@prisma/client';

export class CreateMaterialDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(MaterialType)
  type?: MaterialType;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;
}