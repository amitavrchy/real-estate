import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class DatabaseFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const status =
      exception.code === 'P2025'
        ? 404
        : exception.code === 'P2002'
          ? 409
          : exception.code === 'P2003'
            ? 400
            : 500;
    const message =
      status === 404
        ? 'This record could not be found.'
        : status === 409
          ? 'This record already exists.'
          : status === 400
            ? 'The related record could not be found.'
            : 'We couldn’t save this just now. Please try again.';
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(status)
      .json({ statusCode: status, message });
  }
}
