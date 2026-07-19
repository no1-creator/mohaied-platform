import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const ROLES = ['CLIENT', 'PROVIDER', 'SUPERVISOR', 'ADMIN'];

export class SetVerifiedDto {
  @IsBoolean()
  isVerified: boolean;
}

export class SetActiveDto {
  @IsBoolean()
  isActive: boolean;
}

export class ChangeRoleDto {
  @IsIn(ROLES)
  role: string;
}

export class SendNotificationDto {
  @IsIn(['user', 'role', 'all'])
  target: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsIn(ROLES)
  role?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(140)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  body?: string;

  @IsOptional()
  @IsString()
  linkUrl?: string;
}
