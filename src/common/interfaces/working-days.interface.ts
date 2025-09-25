export interface WorkingHours {
  start: number;
  end: number;
  lunchStart: number;
  lunchEnd: number;
}

export interface WorkingDayConfig {
  timezone: string;
  workingHours: WorkingHours;
  workingDays: number[];
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