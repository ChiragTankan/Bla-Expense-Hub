/**
 * Application error codes for categorizing errors
 */
export enum ErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Structured application error with HTTP status code context
 */
export interface AppError {
  /** Human-readable error message */
  message: string;
  /** Error category code */
  code: ErrorCode;
  /** HTTP status code to return */
  statusCode: number;
  /** Optional additional details */
  details?: Record<string, unknown>;
}

/**
 * Factory for NOT_FOUND errors (404)
 */
export const notFound = (
  resource: string,
  identifier?: string | number,
): AppError => ({
  message: identifier
    ? `${resource} with ID ${identifier} not found`
    : `${resource} not found`,
  code: ErrorCode.NOT_FOUND,
  statusCode: 404,
});

/**
 * Factory for ALREADY_EXISTS errors (400)
 */
export const alreadyExists = (
  resource: string,
  field: string,
  value?: string,
): AppError => ({
  message: value
    ? `${resource} with ${field} '${value}' already exists`
    : `${resource} with this ${field} already exists`,
  code: ErrorCode.ALREADY_EXISTS,
  statusCode: 400,
});

export const badRequest = (message: string): AppError => ({
  message,
  code: ErrorCode.VALIDATION_FAILED,
  statusCode: 400,
});

/**
 * Factory for VALIDATION_FAILED errors (400)
 */
export const validationFailed = (
  message: string,
  details?: Record<string, unknown>,
): AppError => ({
  message,
  code: ErrorCode.VALIDATION_FAILED,
  statusCode: 400,
  details,
});

/**
 * Factory for UNAUTHORIZED errors (401)
 */
export const unauthorized = (
  message = 'Authentication required',
): AppError => ({
  message,
  code: ErrorCode.UNAUTHORIZED,
  statusCode: 401,
});

/**
 * Factory for FORBIDDEN errors (403)
 */
export const forbidden = (
  message = 'You do not have permission to perform this action',
): AppError => ({
  message,
  code: ErrorCode.FORBIDDEN,
  statusCode: 403,
});

/**
 * Factory for INTERNAL_ERROR errors (500)
 */
export const internalError = (
  message = 'An unexpected error occurred',
): AppError => ({
  message,
  code: ErrorCode.INTERNAL_ERROR,
  statusCode: 500,
});
