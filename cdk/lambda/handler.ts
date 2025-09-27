import { configure as serverlessExpress } from '@vendia/serverless-express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import type { Context, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import express from 'express';

let cachedServer: any;

async function bootstrap(): Promise<any> {
  if (!cachedServer) {
    console.log('🚀 Initializing NestJS app for Lambda...');
    
    const expressApp = express();
    
    // Middleware de debugging
    expressApp.use((req, res, next) => {
      console.log(`🌐 Express Request: ${req.method} ${req.path}`, {
        query: req.query,
        params: req.params
      });
      next();
    });
    
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
      logger: ['error', 'warn', 'log', 'debug']
    });

    // Configurar global prefix para que coincida con API Gateway
    app.setGlobalPrefix('api');
    
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }));
    
    app.useGlobalFilters(new HttpExceptionFilter());
    app.enableCors();

    // Swagger documentation (disponible en Lambda)
    const config = new DocumentBuilder()
      .setTitle('Working Days API - AWS Lambda')
      .setDescription(`
        ## 🚀 API para cálculo de fechas hábiles en Colombia
        
        **Desplegada en AWS Lambda con CDK**
        
        ### Características:
        - ✅ **Serverless**: AWS Lambda + API Gateway
        - ✅ **Días festivos**: Colombianos actualizados automáticamente
        - ✅ **Horario laboral**: 8:00 AM - 5:00 PM (almuerzo 12:00-1:00 PM)
        - ✅ **Zona horaria**: Colombia (America/Bogota)
        - ✅ **Escalabilidad**: Auto-scaling automático
        - ✅ **Monitoreo**: CloudWatch integrado
        
        ### Arquitectura:
        - **Runtime**: Node.js 18.x en AWS Lambda
        - **API Gateway**: REST API con CORS habilitado
        - **Infrastructure**: AWS CDK (TypeScript)
        - **Framework**: NestJS con Express
      `)
      .setVersion('1.0')
      .addTag('working-days', 'Cálculo de fechas hábiles')
      .addTag('aws-lambda', 'Serverless deployment')
      .setContact('Developer', 'https://github.com/Googluu/working-days-api', 'sneyder.h.rodriguez@gmail.com')
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .build();
      
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    await app.init();
    
    cachedServer = serverlessExpress({ app: expressApp });
    console.log('NestJS app initialized for Lambda');
  }
  
  return cachedServer;
}

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  console.log('📨 Lambda Event:', JSON.stringify({
    path: event.path,
    method: event.httpMethod,
    query: event.queryStringParameters
  }));
  
  try {
    const server = await bootstrap();
    
    const result = await server(event, context);
    
    console.log('✅ Lambda Response:', JSON.stringify({
      statusCode: result.statusCode,
      body: typeof result.body === 'string' ? result.body.substring(0, 200) : result.body
    }));
    
    return result;
  } catch (error) {
    const err = error as Error;
    console.error('❌ Lambda handler error:', {
      message: err.message,
      name: err.name,
      stack: err.stack
    });
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'InternalServerError',
        message: `Handler error: ${err.message}`
      })
    };
  }
};