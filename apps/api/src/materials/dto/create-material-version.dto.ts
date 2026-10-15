import { IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateMaterialVersionDto {
  @IsOptional()
  @IsString()
  changeSummary?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsUrl()
  externalUrl?: string;

  @IsOptional()
  @IsString()
  externalFileId?: string;

  @IsOptional()
  @IsString()
  externalVersionId?: string;
}