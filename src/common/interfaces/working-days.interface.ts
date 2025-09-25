export interface WorkingHours {
  start: number;
  end: number;
  lunchStart: number;
  lunchEnd: number;
}

export interface WorkingDayConfig {
  timezone: string; // 'America/Bogota'
  workingHours: WorkingHours; // 8-17 con almuerzo 12-13
  workingDays: number[]; // [1,2,3,4,5] = Lun-Vie
}

export interface ApiSuccessResponse {
  date: string;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
}

export interface ParsedQueryParams {
  days?: number;
  hours?: number;
  date?: Date;
}