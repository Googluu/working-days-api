import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import * as moment from 'moment-timezone';
import { HolidaysService } from '../holidays/holidays.service';
import { 
  WorkingDayConfig, 
  ParsedQueryParams, 
  ApiSuccessResponse 
} from '../common/interfaces/working-days.interface';
import { WorkingDaysQueryDto } from '../common/dto/working-days.dto';

/**
 * Servicio principal para el cálculo de fechas hábiles en Colombia.
 * 
 * Maneja toda la lógica de negocio relacionada con:
 * - Ajuste a horarios laborales
 * - Suma de días y horas hábiles
 * - Exclusión de días festivos
 * - Conversión de zonas horarias (Colombia ↔ UTC)
 * 
 * @example
 * ```typescript
 * // Sumar 1 día + 2 horas desde fecha específica
 * const result = service.calculateWorkingDate({
 *   days: '1',
 *   hours: '2', 
 *   date: '2025-04-10T15:00:00.000Z'
 * });
 * // Returns: { date: '2025-04-21T20:00:00.000Z' }
 * ```
 */

@Injectable()
export class WorkingDaysService {
  private readonly config: WorkingDayConfig = {
    timezone: 'America/Bogota',
    workingHours: {
      start: 8,    // 8:00 AM
      end: 17,     // 5:00 PM
      lunchStart: 12, // 12:00 PM
      lunchEnd: 13    // 1:00 PM
    },
    workingDays: [1, 2, 3, 4, 5] // lunes a viernes
  };

  // constructor(private readonly holidaysService: HolidaysService) {
  //   console.log('🔧 WorkingDaysService initialized with config:', this.config);
  // }
  constructor(
    @Inject(HolidaysService) // ← Inyección explícita
    private readonly holidaysService: HolidaysService
  ) {
    console.log('🔧 WorkingDaysService constructor called');
    console.log('🔧 HolidaysService:', this.holidaysService ? '✅ Injected' : '❌ NOT injected');
  }
  calculateWorkingDate(queryDto: WorkingDaysQueryDto): ApiSuccessResponse {
    const params = this.parseAndValidateParams(queryDto);
    
    // Obtener fecha de inicio en la zona horaria de Colombia
    const startDate = params.date 
      ? moment.tz(params.date, this.config.timezone)
      : moment.tz(this.config.timezone);

    let resultDate = this.adjustToWorkingTime(startDate.clone());

    // Primero agregue dias si se especifica
    if (params.days) {
      resultDate = this.addWorkingDays(resultDate, params.days);
    }

    // Luego agregue horas si se especifica
    if (params.hours) {
      resultDate = this.addWorkingHours(resultDate, params.hours);
    }

    // convertir a UTC y luego retornar
    console.log(`🎯 Final result:`, resultDate.utc().toISOString());
    return {
      date: resultDate.utc().toISOString()
    };
  }

  private parseAndValidateParams(queryDto: WorkingDaysQueryDto): ParsedQueryParams {
    const { days, hours, date } = queryDto;

    // Se debe proporcionar al menos un parámetro
    if (!days && !hours) {
      throw new BadRequestException('At least one parameter (days or hours) must be provided');
    }

    const params: ParsedQueryParams = {};
    // conversion de str a numb
    if (days) {
      const daysNum = parseInt(days, 10);
      if (isNaN(daysNum) || daysNum <= 0) {
        throw new BadRequestException('days must be a positive integer');
      }
      params.days = daysNum;
    }

    if (hours) {
      const hoursNum = parseInt(hours, 10);
      if (isNaN(hoursNum) || hoursNum <= 0) {
        throw new BadRequestException('hours must be a positive integer');
      }
      params.hours = hoursNum;
    }

    if (date) {
      try {
        params.date = new Date(date);
        if (isNaN(params.date.getTime())) {
          throw new Error('Invalid date');
        }
      } catch {
        throw new BadRequestException('date must be a valid ISO 8601 date string with Z suffix');
      }
    }

    console.log(`parametros recibidos - days: ${params.days}, hours: ${params.hours}, date: ${params.date?.toISOString()}`);

    return params;
  }

  private isWorkingDay(date: moment.Moment): boolean {
    const dayOfWeek = date.day();
    const isWeekday = this.config.workingDays.includes(dayOfWeek);
    const isNotHoliday = !this.holidaysService.isHoliday(date.toDate());
    
    return isWeekday && isNotHoliday;
  }

  private adjustToWorkingTime(date: moment.Moment): moment.Moment {
    const workingDate = date.clone();
    
    // si no es dia laborable pasar al siguiente dia laborable (fin de semana o festivo)
    while (!this.isWorkingDay(workingDate)) {
      workingDate.add(1, 'day').startOf('day').hour(this.config.workingHours.start); // siguiente dia 8 AM
    }
    
    // si es dia laborable pero fuera de horario laboral, ajuste
    const hour = workingDate.hour();
    const { start, end, lunchStart, lunchEnd } = this.config.workingHours;
    
    if (hour < start) {
      // Antes del horario laboral
      workingDate.hour(start).minute(0).second(0).millisecond(0);
    } else if (hour >= end) {
      // Después del horario laboral pasar al siguiente día laborable
      workingDate.add(1, 'day');
      while (!this.isWorkingDay(workingDate)) {
        workingDate.add(1, 'day');
      }
      workingDate.hour(start).minute(0).second(0).millisecond(0);
    } else if (hour >= lunchStart && hour < lunchEnd) {
      // durante el descanso de almuerzo
      workingDate.hour(lunchEnd).minute(0).second(0).millisecond(0);
    }
    
    return workingDate;
  }

  private addWorkingDays(startDate: moment.Moment, days: number): moment.Moment {
    let resultDate = startDate.clone();
    
    for (let i = 0; i < days; i++) {
      do {
        resultDate.add(1, 'day');
      } while (!this.isWorkingDay(resultDate)); // saltar fines de semana y festivos
    }
    
    return resultDate;
  }

  private addWorkingHours(startDate: moment.Moment, hours: number): moment.Moment {
    let resultDate = startDate.clone();
    let remainingHours = hours;
    
    while (remainingHours > 0) {
      const { lunchStart, lunchEnd, end } = this.config.workingHours;
      const currentHour = resultDate.hour();
      const currentMinute = resultDate.minute();
      
      let availableHoursUntilLunch = 0;
      let availableHoursAfterLunch = 0;
      
      // Calcular horas disponibles antes del almuerzo
      if (currentHour < lunchStart) {
        availableHoursUntilLunch = lunchStart - currentHour - (currentMinute / 60);
      }
      
      // Calcular horas disponibles despues del almuerzo
      if (currentHour < lunchEnd) {
        availableHoursAfterLunch = end - lunchEnd;
      } else if (currentHour < end) {
        availableHoursAfterLunch = end - currentHour - (currentMinute / 60);
      }
      
      const totalAvailableHours = availableHoursUntilLunch + availableHoursAfterLunch;
      
      if (remainingHours <= totalAvailableHours) {
        // Puede terminar hoy
        if (remainingHours <= availableHoursUntilLunch) {
          // Terminar antes del almuerzo
          resultDate.add(remainingHours, 'hours');
          remainingHours = 0;
        } else {
          // Necesita continuar después del almuerzo
          const hoursAfterLunch = remainingHours - availableHoursUntilLunch;
          resultDate.hour(lunchEnd).minute(0).second(0).millisecond(0);
          resultDate.add(hoursAfterLunch, 'hours');
          remainingHours = 0;
        }
      } else {
        // Mover al siguiente día laborable
        remainingHours -= totalAvailableHours;
        resultDate.add(1, 'day');
        
        while (!this.isWorkingDay(resultDate)) {
          resultDate.add(1, 'day');
        }
        
        resultDate.hour(this.config.workingHours.start).minute(0).second(0).millisecond(0);
      }
    }
    
    return resultDate;
  }
}