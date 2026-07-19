import { IsOptional, IsString } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  status?: string; // TODO | DOING | DONE

  @IsOptional() @IsString()
  priority?: string; // LOW | MEDIUM | HIGH

  @IsOptional() @IsString()
  dueDate?: string; // ISO date

  @IsOptional() @IsString()
  clientId?: string;

  @IsOptional() @IsString()
  projectRef?: string;
}

export class UpdateTaskDto {
  @IsOptional() @IsString()
  title?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  status?: string;

  @IsOptional() @IsString()
  priority?: string;

  @IsOptional() @IsString()
  dueDate?: string;

  @IsOptional() @IsString()
  clientId?: string;

  @IsOptional() @IsString()
  projectRef?: string;
}
