import { Request, Response, NextFunction } from 'express';
import { logger } from '@/config/logger';
import { sendError } from '@/utils/response';

export interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (err: AppError, req: Request, res: Response, _next: NextFunction) => {
  const requestId = req.id;

  logger.error(`${err.message} - ${req.method} ${req.path} - ${req.ip}`, {
    requestId,
    stack: err.stack,
  });

  const statusCode = err.statusCode || 500;
  // Never leak internal exception details for 500 errors
  const message = statusCode === 500 ? 'Internal Server Error' : (err.message || 'Internal Server Error');

  return sendError(
    res,
    message,
    statusCode,
    { requestId } // Surface requestId for production debugging without leaking internals
  );
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route Not Found - ${req.path}`) as AppError;
  err.statusCode = 404;
  next(err);
};
