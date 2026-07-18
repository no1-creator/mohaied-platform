import {
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateInvitationDto {
  @IsString()
  @MinLength(2)
  inviteeName: string;

  @IsOptional()
  @IsEmail()
  inviteeEmail?: string;

  @IsOptional()
  @IsString()
  inviteePhone?: string;

  @IsOptional()
  @IsString()
  inviteeType?: string;

  @IsString()
  @MinLength(3)
  projectTitle: string;

  @IsOptional()
  @IsString()
  field?: string;

  @IsString()
  @MinLength(10)
  projectDescription: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMax?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number;

  @IsOptional()
  @IsString()
  message?: string;
}

export class UpdateInvitationStatusDto {
  @IsString()
  @IsIn(['PENDING', 'CONTACTED', 'ACCEPTED', 'DECLINED', 'CLOSED'])
  status: string;

  @IsOptional()
  @IsString()
  adminNote?: string;
}
