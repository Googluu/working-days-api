import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  app.useGlobalFilters(new HttpExceptionFilter());

  // CORS
  app.enableCors();

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Working Days API')
    .setDescription(`
      API para cálculo de fechas hábiles en Colombia
      
      ## Características
      - 🇨🇴 Días festivos colombianos actualizados
      - ⏰ Horario laboral: 8:00 AM - 5:00 PM (almuerzo 12:00 PM - 1:00 PM)
      - 🌍 Zona horaria: Colombia (America/Bogota)
      - 📅 Días hábiles: Lunes a Viernes
      - 🔄 Conversión automática a UTC
      
      ## Reglas de Negocio
      - Si la fecha inicial está fuera del horario laboral, se ajusta al horario más cercano
      - Los cálculos se realizan en hora de Colombia y el resultado se convierte a UTC
      - El almuerzo (12:00 PM - 1:00 PM) no cuenta como tiempo hábil
      - Se excluyen automáticamente los días festivos colombianos
    `)
    .setVersion('1.0')
    .addTag('working-days', 'Cálculo de fechas hábiles')
    .addTag('health', 'Estado de la aplicación')
    .setContact(
      'Desarrollador',
      'https://github.com/tu-usuario/working-days-api',
      'tu-email@ejemplo.com'
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:3000', 'Desarrollo local')
    .addServer('https://tu-api.vercel.app', 'Producción')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);


  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
