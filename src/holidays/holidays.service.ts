import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios from 'axios';

/**
 * Servicio para gestionar los días festivos colombianos.
 * 
 * Carga automáticamente la lista de festivos desde una fuente externa
 * al inicializar la aplicación y proporciona métodos para consultar
 * si una fecha específica es festiva.
 * 
 * @example
 * ```typescript
 * const isHoliday = holidaysService.isHoliday(new Date('2025-01-01')); // true
 * ```
 */

@Injectable()
export class HolidaysService implements OnModuleInit {
  private readonly logger = new Logger(HolidaysService.name);
  private holidays: Set<string> = new Set();
  private readonly holidaysUrl = 'https://content.capta.co/Recruitment/WorkingDays.json';

  constructor() {
    console.log('🔧 HolidaysService constructor called');
  }


  // se ejecuta al iniciar la app
  async onModuleInit(): Promise<void> {
    await this.loadHolidays();
  }

  private async loadHolidays(): Promise<void> {
    try {
      this.logger.log('Loading holidays from external service...');
      const response = await axios.get<string[]>(this.holidaysUrl, {
        timeout: 10000,
      });
      
      this.holidays = new Set(response.data); // cambiar/set para 0(1)
      this.logger.log(`Loaded ${this.holidays.size} holidays`);
    } catch (error) {
      this.logger.error('Failed to load holidays:', error);
      // this.logger.error('Failed to load holidays:', error.message);
      throw new Error('Failed to initialize holidays service');
    }
  }

  isHoliday(date: Date): boolean {
    const dateStr = date.toISOString().split('T')[0]; // yyyy-mm-dd
    return this.holidays.has(dateStr);
  }

  async refreshHolidays(): Promise<void> {
    await this.loadHolidays();
  }
}

 /**
   * Verifica si una fecha específica es día festivo en Colombia.
   * 
   * @param date - Fecha a verificar
   * @returns true si es día festivo, false en caso contrario
   * 
   * @example
   * ```typescript
   * // Año Nuevo
   * isHoliday(new Date('2025-01-01')) // true
   * 
   * // Día normal
   * isHoliday(new Date('2025-01-02')) // false
   * 
   * // Semana Santa 2025
   * isHoliday(new Date('2025-04-17')) // true 
   * */