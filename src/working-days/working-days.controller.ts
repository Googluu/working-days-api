import { Controller, Get, Query } from '@nestjs/common';
import { WorkingDaysService } from './working-days.service';
import { WorkingDaysQueryDto } from '../common/dto/working-days.dto';
import type { ApiSuccessResponse } from '../common/interfaces/working-days.interface';

@Controller('api/working-days')
export class WorkingDaysController {
  constructor(private readonly workingDaysService: WorkingDaysService) {}

  @Get()
  calculateWorkingDate(@Query() query: WorkingDaysQueryDto): ApiSuccessResponse {
    return this.workingDaysService.calculateWorkingDate(query);
  }
}