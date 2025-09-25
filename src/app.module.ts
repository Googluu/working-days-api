import { Module } from '@nestjs/common';
import { WorkingDaysModule } from './working-days/working-days.module';
import { HolidaysModule } from './holidays/holidays.module';

@Module({
  imports: [WorkingDaysModule, HolidaysModule],
})
export class AppModule {}
