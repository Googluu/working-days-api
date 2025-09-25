import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ApiErrorResponse } from '../interfaces/working-days.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: number;
    let errorResponse: ApiErrorResponse;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        errorResponse = {
          error: 'InvalidParameters',
          message: exceptionResponse,
        };
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        errorResponse = {
          error: 'InvalidParameters',
          message: Array.isArray(responseObj.message) 
            ? responseObj.message.join(', ')
            : responseObj.message || 'Invalid parameters',
        };
      } else {
        errorResponse = {
          error: 'InvalidParameters',
          message: 'Invalid parameters',
        };
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = {
        error: 'InternalServerError',
        message: 'An unexpected error occurred',
      };
    }

    response.status(status).json(errorResponse);
  }
}