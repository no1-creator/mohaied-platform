import { IsBoolean } from 'class-validator';

export class SetVerifiedDto {
  @IsBoolean()
  isVerified: boolean;
}

export class SetActiveDto {
  @IsBoolean()
  isActive: boolean;
}
