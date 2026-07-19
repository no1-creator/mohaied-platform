import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  projectId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content: string;
}
