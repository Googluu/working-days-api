import { Injectable, BadRequestException } from '@nestjs/common';
import * as moment from 'moment-timezone';
import { HolidaysService } from '../holidays/holidays.service';
import { 
  WorkingDayConfig, 
  ParsedQueryParams, 
  ApiSuccessResponse 
} from '../common/interfaces/working-days.interface';
import { WorkingDaysQueryDto } from '../common/dto/working-days.dto';

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
    workingDays: [1, 2, 3, 4, 5] // Monday to Friday
  };

  constructor(private readonly holidaysService: HolidaysService) {}

  calculateWorkingDate(queryDto: WorkingDaysQueryDto): ApiSuccessResponse {
    const params = this.parseAndValidateParams(queryDto);
    
    // Get starting date in Colombia timezone
    const startDate = params.date 
      ? moment.tz(params.date, this.config.timezone)
      : moment.tz(this.config.timezone);

    let resultDate = this.adjustToWorkingTime(startDate.clone());

    // First add days if specified
    if (params.days) {
      resultDate = this.addWorkingDays(resultDate, params.days);
    }

    // Then add hours if specified
    if (params.hours) {
      resultDate = this.addWorkingHours(resultDate, params.hours);
    }

    // Convert to UTC and return
    return {
      date: resultDate.utc().toISOString()
    };
  }

  private parseAndValidateParams(queryDto: WorkingDaysQueryDto): ParsedQueryParams {
    const { days, hours, date } = queryDto;

    // At least one parameter must be provided
    if (!days && !hours) {
      throw new BadRequestException('At least one parameter (days or hours) must be provided');
    }

    const params: ParsedQueryParams = {};

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
    
    // If not a working day, move to next working day
    while (!this.isWorkingDay(workingDate)) {
      workingDate.add(1, 'day').startOf('day').hour(this.config.workingHours.start);
    }
    
    // If working day but outside working hours, adjust
    const hour = workingDate.hour();
    const { start, end, lunchStart, lunchEnd } = this.config.workingHours;
    
    if (hour < start) {
      // Before working hours
      workingDate.hour(start).minute(0).second(0).millisecond(0);
    } else if (hour >= end) {
      // After working hours, move to next working day
      workingDate.add(1, 'day');
      while (!this.isWorkingDay(workingDate)) {
        workingDate.add(1, 'day');
      }
      workingDate.hour(start).minute(0).second(0).millisecond(0);
    } else if (hour >= lunchStart && hour < lunchEnd) {
      // During lunch break
      workingDate.hour(lunchEnd).minute(0).second(0).millisecond(0);
    }
    
    return workingDate;
  }

  private addWorkingDays(startDate: moment.Moment, days: number): moment.Moment {
    let resultDate = startDate.clone();
    
    for (let i = 0; i < days; i++) {
      do {
        resultDate.add(1, 'day');
      } while (!this.isWorkingDay(resultDate));
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
      
      // Calculate available hours before lunch
      if (currentHour < lunchStart) {
        availableHoursUntilLunch = lunchStart - currentHour - (currentMinute / 60);
      }
      
      // Calculate available hours after lunch
      if (currentHour < lunchEnd) {
        availableHoursAfterLunch = end - lunchEnd;
      } else if (currentHour < end) {
        availableHoursAfterLunch = end - currentHour - (currentMinute / 60);
      }
      
      const totalAvailableHours = availableHoursUntilLunch + availableHoursAfterLunch;
      
      if (remainingHours <= totalAvailableHours) {
        // Can finish today
        if (remainingHours <= availableHoursUntilLunch) {
          // Finish before lunch
          resultDate.add(remainingHours, 'hours');
          remainingHours = 0;
        } else {
          // Need to continue after lunch
          const hoursAfterLunch = remainingHours - availableHoursUntilLunch;
          resultDate.hour(lunchEnd).minute(0).second(0).millisecond(0);
          resultDate.add(hoursAfterLunch, 'hours');
          remainingHours = 0;
        }
      } else {
        // Move to next working day
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