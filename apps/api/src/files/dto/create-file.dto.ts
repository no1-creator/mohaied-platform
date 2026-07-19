import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateFileDto {
  @IsString()
  @MaxLength(300)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  mimeType?: string;

  // محتوى الملف كـ data URL (data:...;base64,....)
  @IsString()
  @MaxLength(16000000)
  dataUrl: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  submissionId?: string;
}
