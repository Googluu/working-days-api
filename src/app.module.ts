import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WorkingDaysModule } from './working-days/working-days.module';
import { HolidaysModule } from './holidays/holidays.module';

@Module({
  imports: [WorkingDaysModule, HolidaysModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
