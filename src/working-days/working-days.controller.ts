import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { WorkingDaysService } from './working-days.service';
import { WorkingDaysQueryDto } from '../common/dto/working-days.dto';
import type { ApiSuccessResponse } from '../common/interfaces/working-days.interface';

@ApiTags('working-days')
@Controller('api/working-days')
export class WorkingDaysController {
  constructor(private readonly workingDaysService: WorkingDaysService) {}

  @Get()
  @ApiOperation({
    summary: 'Calcular fecha hábil resultante',
    description: `
      Calcula la fecha y hora resultante después de sumar días y/o horas hábiles 
      a partir de la fecha actual (Colombia) o una fecha específica proporcionada.
      
      ## Proceso de cálculo:
      1. Si se proporciona \`date\`, se convierte de UTC a hora de Colombia
      2. Si no se proporciona \`date\`, se usa la hora actual de Colombia  
      3. La fecha se ajusta al horario laboral más cercano si está fuera del horario
      4. Se suman primero los \`days\` (si se proporcionan)
      5. Luego se suman las \`hours\` (si se proporcionan)
      6. El resultado se convierte de hora de Colombia a UTC
      
      ## Ejemplos de uso:
      - \`?days=1\` - Suma 1 día hábil
      - \`?hours=8\` - Suma 8 horas hábiles (1 día laboral completo)
      - \`?days=5&hours=4\` - Suma 5 días hábiles + 4 horas hábiles
      - \`?days=1&date=2025-04-10T15:00:00Z\` - Suma 1 día desde fecha específica
    `,
  })
  calculateWorkingDate(@Query() query: WorkingDaysQueryDto): ApiSuccessResponse {
    return this.workingDaysService.calculateWorkingDate(query);
  }
}