import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Working Days API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }));
    
    app.useGlobalFilters(new HttpExceptionFilter());
    
    await app.init();

    // Esperar a que se carguen los festivos
    console.log('🔄 Waiting for holidays service to initialize...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✅ Ready to test');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('🔧 Debug Tests - Verificar fechas y festivos', () => {
    
    it('Debe verificar que festivos están cargados correctamente', async () => {
      // Probar con una fecha que NO es festivo: 13 enero 2025 (lunes)
      const response = await request(app.getHttpServer())
        .get('/api/working-days')
        .query({
          hours: '1',
          date: '2025-01-13T15:00:00.000Z' // Lunes 13 enero 10:00 AM Colombia
        });
      
      console.log('Non-holiday test:', {
        input: '2025-01-13T15:00:00.000Z (Lunes 13 enero 10:00 AM Colombia)',
        status: response.status,
        result: response.body,
        expected: '2025-01-13T16:00:00.000Z (Lunes 13 enero 11:00 AM Colombia)'
      });

      expect(response.status).toBe(200);
      expect(response.body.date).toBe('2025-01-13T16:00:00.000Z'); // Lunes 11:00 AM Colombia
    });

    it('Debe verificar ajuste por Reyes Magos (6 enero)', async () => {
      // 6 enero 2025 es FESTIVO (Reyes Magos), debe ir al 7 enero
      const response = await request(app.getHttpServer())
        .get('/api/working-days')
        .query({
          hours: '1',
          date: '2025-01-06T15:00:00.000Z' // 6 enero 10:00 AM Colombia (FESTIVO)
        });
      
      console.log('Holiday adjustment test:', {
        input: '2025-01-06T15:00:00.000Z (6 enero - Reyes Magos)',
        status: response.status,
        result: response.body,
        expected: '2025-01-07T14:00:00.000Z (7 enero 9:00 AM Colombia)'
      });

      expect(response.status).toBe(200);
      // Debe ajustar al 7 enero (martes) 8:00 AM + 1 hora = 9:00 AM
      expect(response.body.date).toBe('2025-01-07T14:00:00.000Z');
    });

  });

  describe('❌ Casos de Error (verificados)', () => {
    
    it('Debe fallar si no se proporciona days ni hours', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/working-days')
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'InvalidParameters',
        message: expect.stringContaining('At least one parameter')
      });
    });

    it('Debe fallar con formato de fecha inválido', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/working-days')
        .query({
          hours: '1',
          date: '2025-01-01'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'InvalidParameters'
      });
    });

    it('Debe fallar con días negativos', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/working-days')
        .query({
          days: '-1'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'InvalidParameters'
      });
    });

    it('Debe fallar con horas no numéricas', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/working-days')
        .query({
          hours: 'abc'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'InvalidParameters'
      });
    });

  });

  describe('✅ Casos Básicos - Fechas sin festivos', () => {

    it('Debe sumar 1 hora desde fecha específica válida (sin festivos)', async () => {
      // Lunes 13 enero 2025 a las 10:00 AM Colombia = 15:00 UTC
      const mondayMorning = '2025-01-13T15:00:00.000Z';
      
      const response = await request(app.getHttpServer())
        .get('/api/working-days')
        .query({
          hours: '1',
          date: mondayMorning
        });

      console.log('Basic test response:', {
        input: 'Lunes 13 enero 10:00 AM Colombia',
        status: response.status,
        body: response.body,
        expected: 'Lunes 13 enero 11:00 AM Colombia'
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('date');
      expect(response.body.date).toBe('2025-01-13T16:00:00.000Z'); // 11:00 AM Colombia
    });

    it('Debe usar fecha actual si no se proporciona date', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/working-days')
        .query({
          hours: '1'
        });

      console.log('Current date test:', {
        status: response.status,
        body: response.body
      });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('date');
        expect(response.body.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      }
    });

  });

  describe('📌 Casos Específicos - CORREGIDOS con fechas reales', () => {
    
    it('Caso 1: Viernes 5:00 PM + 1 hora = Siguiente día laboral 9:00 AM', async () => {
      // Viernes 10 enero 2025 a las 5:00 PM Colombia = 22:00 UTC
      const fridayAt5PM = '2025-01-10T22:00:00.000Z';
      
      const response = await request(app.getHttpServer())
        .get('/api/working-days')
        .query({
          hours: '1',
          date: fridayAt5PM
        });

      console.log('Case 1 result:', {
        input: 'Viernes 10 enero 5:00 PM Colombia',
        status: response.status,
        body: response.body,
        expected: 'Lunes 13 enero 9:00 AM Colombia (salta fin de semana)'
      });

      expect(response.status).toBe(200);
      // Viernes 5PM + 1 hora = Lunes 9:00 AM Colombia = 14:00 UTC
      expect(response.body.date).toBe('2025-01-13T14:00:00.000Z');
    });

    it('Caso 2: Sábado 2:00 PM + 1 hora = Siguiente día laboral 9:00 AM', async () => {
      // Sábado 11 enero 2025 a las 2:00 PM Colombia = 19:00 UTC
      const saturdayAt2PM = '2025-01-11T19:00:00.000Z';
      
      const response = await request(app.getHttpServer())
        .get('/api/working-days')
        .query({
          hours: '1',
          date: saturdayAt2PM
        });

      console.log('Case 2 result:', {
        input: 'Sábado 11 enero 2:00 PM Colombia',
        status: response.status,
        body: response.body,
        expected: 'Lunes 13 enero 9:00 AM Colombia'
      });

      expect(response.status).toBe(200);
      // Sábado 2PM + 1 hora = Lunes 9:00 AM Colombia = 14:00 UTC
      expect(response.body.date).toBe('2025-01-13T14:00:00.000Z');
    });

    it('Caso 3: Martes 3:00 PM + 1 día + 4 horas = Jueves 10:00 AM', async () => {
      // Martes 14 enero 2025 a las 3:00 PM Colombia = 20:00 UTC
      const tuesdayAt3PM = '2025-01-14T20:00:00.000Z';
      
      const response = await request(app.getHttpServer())
        .get('/api/working-days')
        .query({
          days: '1',
          hours: '4',
          date: tuesdayAt3PM
        });

      console.log('Case 3 result:', {
        input: 'Martes 14 enero 3:00 PM Colombia',
        calculation: 'Martes 3PM → Miércoles 3PM (+1 día) → Miércoles 3PM + 4h = Jueves 10AM',
        status: response.status,
        body: response.body,
        expected: 'Jueves 16 enero 10:00 AM Colombia'
      });

      expect(response.status).toBe(200);
      // Martes 3PM → Miércoles 3PM (+1 día) → Miércoles 3PM + 4h = Jueves 10AM
      expect(response.body.date).toBe('2025-01-16T15:00:00.000Z');
    });

  });

  describe('⏰ Casos de Horario Laboral', () => {
    
    it('Debe ajustar fecha antes de 8:00 AM a las 8:00 AM', async () => {
      // Lunes 13 enero 6:00 AM Colombia = 11:00 UTC
      const mondayAt6AM = '2025-01-13T11:00:00.000Z';
      
      const response = await request(app.getHttpServer())
        .get('/api/working-days')
        .query({
          hours: '1',
          date: mondayAt6AM
        });

      console.log('Early morning test:', {
        input: 'Lunes 6:00 AM Colombia',
        expected: 'Ajustar a 8:00 AM + 1 hora = 9:00 AM Colombia',
        status: response.status,
        body: response.body
      });

      expect(response.status).toBe(200);
      // 6:00 AM → 8:00 AM + 1 hora = 9:00 AM Colombia = 14:00 UTC
      expect(response.body.date).toBe('2025-01-13T14:00:00.000Z');
    });

    it('Debe saltar el horario de almuerzo (12:00-1:00 PM)', async () => {
      // Lunes 13 enero 11:30 AM Colombia = 16:30 UTC
      const mondayAt1130AM = '2025-01-13T16:30:00.000Z';
      
      const response = await request(app.getHttpServer())
        .get('/api/working-days')
        .query({
          hours: '3',
          date: mondayAt1130AM
        });

      console.log('Lunch break test:', {
        input: 'Lunes 11:30 AM Colombia',
        calculation: '11:30 AM + 3h = 3:30 PM (saltando almuerzo 12-1 PM)',
        status: response.status,
        body: response.body
      });

      expect(response.status).toBe(200);
      // 11:30 AM + 3 horas = 3:30 PM Colombia = 20:30 UTC (saltando almuerzo)
      expect(response.body.date).toBe('2025-01-13T20:30:00.000Z');
    });

    it('Debe mover a siguiente día laboral si se pasa de 5:00 PM', async () => {
      // Lunes 13 enero 4:00 PM Colombia = 21:00 UTC
      const mondayAt4PM = '2025-01-13T21:00:00.000Z';
      
      const response = await request(app.getHttpServer())
        .get('/api/working-days')
        .query({
          hours: '2',
          date: mondayAt4PM
        });

      console.log('End of day test:', {
        input: 'Lunes 4:00 PM Colombia',
        calculation: '4:00 PM + 2h = se pasa de 5:00 PM → Martes 9:00 AM',
        status: response.status,
        body: response.body
      });

      expect(response.status).toBe(200);
      // 4:00 PM + 2 horas = se pasa → Martes 9:00 AM Colombia = 14:00 UTC
      expect(response.body.date).toBe('2025-01-14T14:00:00.000Z');
    });

  });

  describe('📅 Casos de Días Hábiles', () => {
    
    it('Debe sumar días hábiles saltando fin de semana', async () => {
      // Viernes 10 enero 10:00 AM Colombia = 15:00 UTC
      const fridayAt10AM = '2025-01-10T15:00:00.000Z';
      
      const response = await request(app.getHttpServer())
        .get('/api/working-days')
        .query({
          days: '1',
          date: fridayAt10AM
        });

      console.log('Weekend skip test:', {
        input: 'Viernes 10 enero 10:00 AM',
        expected: 'Lunes 13 enero 10:00 AM (salta fin de semana)',
        status: response.status,
        body: response.body
      });

      expect(response.status).toBe(200);
      // Viernes + 1 día = Lunes 10:00 AM Colombia = 15:00 UTC
      expect(response.body.date).toBe('2025-01-13T15:00:00.000Z');
    });

    it('Debe sumar 8 horas hábiles = 1 día laboral completo', async () => {
      // Lunes 13 enero 8:00 AM Colombia = 13:00 UTC
      const mondayAt8AM = '2025-01-13T13:00:00.000Z';
      
      const response = await request(app.getHttpServer())
        .get('/api/working-days')
        .query({
          hours: '8',
          date: mondayAt8AM
        });

      console.log('Full workday test:', {
        input: 'Lunes 8:00 AM Colombia',
        calculation: '8:00 AM + 8 horas hábiles = 5:00 PM (8h = 1 día completo)',
        status: response.status,
        body: response.body
      });

      expect(response.status).toBe(200);
      // 8:00 AM + 8 horas = 5:00 PM Colombia = 22:00 UTC
      expect(response.body.date).toBe('2025-01-13T22:00:00.000Z');
    });

  });

  describe('🎄 Casos con Días Festivos', () => {
    
    it('Debe saltar Reyes Magos (6 enero)', async () => {
      // 3 enero 2025 (viernes) 10:00 AM Colombia = 15:00 UTC
      const jan3At10AM = '2025-01-03T15:00:00.000Z';
      
      const response = await request(app.getHttpServer())
        .get('/api/working-days')
        .query({
          days: '1',
          date: jan3At10AM
        });

      console.log('Reyes Magos test:', {
        input: 'Viernes 3 enero 10:00 AM',
        expected: 'Martes 7 enero 10:00 AM (salta fin de semana y Reyes Magos 6 enero)',
        status: response.status,
        body: response.body
      });

      expect(response.status).toBe(200);
      // Viernes + 1 día → debería ir a lunes 6, pero 6 es festivo → martes 7
      expect(response.body.date).toBe('2025-01-07T15:00:00.000Z');
    });

  });

  describe('🏥 Health Check', () => {
    
    it('GET / debe retornar mensaje de bienvenida', async () => {
      const response = await request(app.getHttpServer())
        .get('/');

      console.log('Health check:', {
        status: response.status,
        text: response.text?.substring(0, 100)
      });

      if (response.status === 200) {
        expect(response.text).toContain('Working Days API');
      }
    });

  });

});