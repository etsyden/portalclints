import { IsOptional, IsString } from 'class-validator';

export class CreateApprovalDto {
  @IsOptional()
  @IsString()
  comment?: string;
}