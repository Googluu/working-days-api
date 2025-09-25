import { IsOptional, IsString, IsNumberString, Matches } from 'class-validator';

export class WorkingDaysQueryDto {
  @IsOptional()
  @IsNumberString({}, { message: 'days must be a valid positive integer' })
  days?: string;

  @IsOptional()
  @IsNumberString({}, { message: 'hours must be a valid positive integer' })
  hours?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/, {
    message: 'date must be in ISO 8601 format with Z suffix (e.g., 2025-08-01T14:00:00.000Z)',
  })
  date?: string;
}