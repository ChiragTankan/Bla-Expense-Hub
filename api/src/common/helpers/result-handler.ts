import { HttpException } from '@nestjs/common';
import { Result } from 'neverthrow';
import { AppError } from '../errors/app-error';

/**
 * Response wrapper type for successful operations
 */
export interface SuccessResponse<T> {
  message: string;
  data: T;
}

/**
 * Handles a neverthrow Result and converts it to an HTTP response.
 */
export function handleResult<T>(
  result: Result<T, AppError>,
  successMessage: string,
): SuccessResponse<T> {
  return result.match(
    (data) => ({
      message: successMessage,
      data,
    }),
    (error) => {
      throw new HttpException(
        {
          message: error.message,
          code: error.code,
          ...(error.details && { details: error.details }),
        },
        error.statusCode,
      );
    },
  );
}

/**
 * Handles a neverthrow Result with a custom success transformer.
 */
export function handleResultWith<T, R>(
  result: Result<T, AppError>,
  onSuccess: (data: T) => R,
): R {
  return result.match(
    (data) => onSuccess(data),
    (error) => {
      throw new HttpException(
        {
          message: error.message,
          code: error.code,
          ...(error.details && { details: error.details }),
        },
        error.statusCode,
      );
    },
  );
}
