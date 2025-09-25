import { Module } from '@nestjs/common';
import { WorkingDaysService } from './working-days.service';
import { WorkingDaysController } from './working-days.controller';
import { HolidaysModule } from '../holidays/holidays.module';

@Module({
  imports: [HolidaysModule],
  providers: [WorkingDaysService],
  controllers: [WorkingDaysController]
})
export class WorkingDaysModule {}
