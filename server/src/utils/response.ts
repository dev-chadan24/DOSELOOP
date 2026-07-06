import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: unknown;
  };
}

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200) => {
  const response: ApiResponse<T> = { success: true, data };
  return res.status(statusCode).json(response);
};

export const sendError = (res: Response, message: string, statusCode = 500, details?: unknown) => {
  const response: ApiResponse = {
    success: false,
    error: { message, details },
  };
  return res.status(statusCode).json(response);
};
