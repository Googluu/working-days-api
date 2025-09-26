import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumberString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class WorkingDaysQueryDto {
  @ApiPropertyOptional({
    description: 'Número de días hábiles a sumar',
    example: 5,
    type: 'integer',
    minimum: 1,
    maximum: 365,
  })
  @IsOptional()
  @IsNumberString({}, { message: 'days must be a valid positive integer' })
  // @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  days?: string;

  @ApiPropertyOptional({
    description: 'Número de horas hábiles a sumar',
    example: 8,
    type: 'integer',
    minimum: 1,
    maximum: 2000,
  })
  @IsOptional()
  @IsNumberString({}, { message: 'hours must be a valid positive integer' })
  // @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  hours?: string;

  @ApiPropertyOptional({
    description: 'Fecha y hora inicial en formato UTC (ISO 8601) con sufijo Z. Si no se proporciona, se usa la hora actual de Colombia.',
    example: '2025-04-10T15:00:00.000Z',
    type: 'string',
    format: 'date-time',
    pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{3})?Z$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/, {
    message: 'date must be in ISO 8601 format with Z suffix (e.g., 2025-08-01T14:00:00.000Z)',
  })
  date?: string;
}