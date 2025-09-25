import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { WorkingDaysService } from './working-days.service';
import { HolidaysService } from '../holidays/holidays.service';

// Mock del HolidaysService
const mockHolidaysService = {
  isHoliday: jest.fn().mockImplementation((date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    // Mock de algunos festivos conocidos
    const mockHolidays = [
      '2025-01-01', // Año Nuevo
      '2025-01-06', // Reyes Magos
      '2025-12-25'  // Navidad
    ];
    return mockHolidays.includes(dateStr);
  })
};

describe('WorkingDaysService', () => {
  let service: WorkingDaysService;
  let holidaysService: HolidaysService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkingDaysService,
        {
          provide: HolidaysService,
          useValue: mockHolidaysService
        }
      ],
    }).compile();

    service = module.get<WorkingDaysService>(WorkingDaysService);
    holidaysService = module.get<HolidaysService>(HolidaysService);
  });

  describe('Validación de Parámetros', () => {

    it('debe lanzar error si no se proporciona days ni hours', () => {
      expect(() => {
        service.calculateWorkingDate({});
      }).toThrow(BadRequestException);
    });

    it('debe lanzar error si days es negativo', () => {
      expect(() => {
        service.calculateWorkingDate({ days: '-1' });
      }).toThrow('days must be a positive integer');
    });

    it('debe lanzar error si hours no es numérico', () => {
      expect(() => {
        service.calculateWorkingDate({ hours: 'abc' });
      }).toThrow('hours must be a valid positive integer');
    });

    it('debe lanzar error si date tiene formato inválido', () => {
      expect(() => {
        service.calculateWorkingDate({ 
          hours: '1', 
          date: '2025-01-01' // Falta formato completo
        });
      }).toThrow('date must be in ISO 8601 format');
    });

  });

  describe('Casos Específicos de la Prueba', () => {

    it('debe calcular correctamente: Viernes 5PM + 1 hora = Lunes 9AM', () => {
      const result = service.calculateWorkingDate({
        hours: '1',
        date: '2025-01-03T22:00:00.000Z' // Viernes 5:00 PM Colombia
      });

      expect(result.date).toBe('2025-01-06T14:00:00.000Z'); // Lunes 9:00 AM Colombia
    });

    it('debe calcular correctamente: Sábado 2PM + 1 hora = Lunes 9AM', () => {
      const result = service.calculateWorkingDate({
        hours: '1',
        date: '2025-01-04T19:00:00.000Z' // Sábado 2:00 PM Colombia
      });

      expect(result.date).toBe('2025-01-06T14:00:00.000Z'); // Lunes 9:00 AM Colombia
    });

    it('debe calcular correctamente: Martes 3PM + 1 día + 4 horas = Jueves 10AM', () => {
      const result = service.calculateWorkingDate({
        days: '1',
        hours: '4',
        date: '2025-01-07T20:00:00.000Z' // Martes 3:00 PM Colombia
      });

      expect(result.date).toBe('2025-01-09T15:00:00.000Z'); // Jueves 10:00 AM Colombia
    });

  });

  describe('Lógica de Días Festivos', () => {

    it('debe saltar Año Nuevo al sumar días', () => {
      const result = service.calculateWorkingDate({
        days: '1',
        date: '2024-12-31T15:00:00.000Z' // 31 dic 10:00 AM Colombia
      });

      // Debe saltar 1 enero (festivo) y ir al 2 enero
      expect(result.date).toBe('2025-01-02T15:00:00.000Z');
    });

    it('debe saltar Reyes Magos al ajustar fecha', () => {
      const result = service.calculateWorkingDate({
        hours: '1',
        date: '2025-01-06T15:00:00.000Z' // 6 enero (festivo) 10:00 AM Colombia
      });

      // Debe ajustar al martes 7 enero 8:00 AM y sumar 1 hora = 9:00 AM
      expect(result.date).toBe('2025-01-07T14:00:00.000Z');
    });

  });

});
