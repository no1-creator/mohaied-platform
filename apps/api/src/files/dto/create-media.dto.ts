import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateMediaDto {
  @IsString()
  @MaxLength(300)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  mimeType?: string;

  // محتوى الصورة كـ data URL (data:image/...;base64,....)
  @IsString()
  @MaxLength(16000000)
  dataUrl: string;
}
