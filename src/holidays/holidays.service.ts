import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class HolidaysService implements OnModuleInit {
  private readonly logger = new Logger(HolidaysService.name);
  private holidays: Set<string> = new Set();
  private readonly holidaysUrl = 'https://content.capta.co/Recruitment/WorkingDays.json';

  async onModuleInit(): Promise<void> {
    await this.loadHolidays();
  }

  private async loadHolidays(): Promise<void> {
    try {
      this.logger.log('Loading holidays from external service...');
      const response = await axios.get<string[]>(this.holidaysUrl, {
        timeout: 10000,
      });
      
      this.holidays = new Set(response.data);
      this.logger.log(`Loaded ${this.holidays.size} holidays`);
    } catch (error) {
      this.logger.error('Failed to load holidays:', error.message);
      throw new Error('Failed to initialize holidays service');
    }
  }

  isHoliday(date: Date): boolean {
    const dateStr = date.toISOString().split('T')[0];
    return this.holidays.has(dateStr);
  }

  async refreshHolidays(): Promise<void> {
    await this.loadHolidays();
  }
}