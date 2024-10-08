import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseResponse } from '../../http/dto';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import { translatePrismaError } from '../utils';

@Catch(Error)
export class ErrorFilter implements ExceptionFilter<Error> {
  private readonly logger: Logger = new Logger(ErrorFilter.name);
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (request.url === '/service-worker.js') {
      return;
    }
    const response: BaseResponse<any> = this.getErrorResponse(
      exception,
      request,
    );
    this.logger.log(
      `[ERROR] PATH: ${request.url} | Response: ${JSON.stringify(response)}`,
    );

    res.status(response.responseCode).json(response);
  }

  getResponseCode(e: Error) {
    if (e instanceof HttpException) {
      return e.getStatus();
    }
    switch ((e as any).name) {
      case BadRequestException.name:
        return HttpStatus.BAD_REQUEST;
      case PrismaClientKnownRequestError.name:
      case PrismaClientValidationError.name:
        return HttpStatus.BAD_REQUEST;
      case NotFoundException.name:
        return HttpStatus.NOT_FOUND;
      case 'ThrottlerException':
        return HttpStatus.TOO_MANY_REQUESTS;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  getErrorResponse(e: Error, request: Request): BaseResponse<any> {
    const response: BaseResponse<any> = new BaseResponse();
    if (
      e instanceof PrismaClientKnownRequestError ||
      e instanceof PrismaClientValidationError
    ) {
      return translatePrismaError(e, 'Operasi Database Gagal');
    } else if (e instanceof BadRequestException) {
      response.responseCode = HttpStatus.BAD_REQUEST;
      response.responseMessage = e.message;
      response.responseData = this.mapValidationError(e);
    } else {
      response.responseCode = this.getResponseCode(e);
      response.responseMessage = e.message;
      response.responseData = request.url;
    }
    return response;
  }

  mapValidationError(error: any): any {
    const validationErrors = error.message;

    try {
      // Format the errors in the desired format: fieldName: [error messages]
      const formattedErrors = {} as any;
      const response = error.getResponse()?.message;
      response.forEach((error: any) => {
        const field = error.property;
        formattedErrors[field] = Object.values(error.constraints);
      });
      return formattedErrors;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return validationErrors;
    }
  }
}
