import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

/**
 * Standard API error response format
 */
export interface ApiErrorResponse {
  error: string
  details?: any
  statusCode?: number
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object'

const getNonEmptyMessage = (error: unknown): string | undefined => {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  if (isRecord(error) && typeof error.message === 'string' && error.message.trim()) {
    return error.message
  }

  return undefined
}

const serializeErrorForLog = (error: unknown): string => {
  if (error instanceof Error) {
    return error.stack || `${error.name}: ${error.message || '(empty message)'}`
  }

  if (isRecord(error)) {
    const payload = Object.getOwnPropertyNames(error).reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = error[key]
      return acc
    }, {})

    if (typeof payload.message === 'string' && !payload.message.trim()) {
      payload.message = '(empty message)'
    }

    try {
      return JSON.stringify(payload)
    } catch {
      return String(error)
    }
  }

  return String(error)
}

// Custom error classes
export class NotFoundError extends Error {
  statusCode = 404
  constructor(message: string = 'Resource not found') {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends Error {
  statusCode = 409
  constructor(message: string = 'Resource conflict') {
    super(message)
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends Error {
  statusCode = 429
  constructor(message: string = 'Too many requests') {
    super(message)
    this.name = 'RateLimitError'
  }
}

export class ValidationError extends Error {
  statusCode = 400
  details?: any
  constructor(message: string = 'Validation failed', details?: any) {
    super(message)
    this.name = 'ValidationError'
    this.details = details
  }
}

export class AuthenticationError extends Error {
  statusCode = 401
  constructor(message: string = 'Authentication required') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error {
  statusCode = 403
  constructor(message: string = 'Forbidden') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

/**
 * Map errors to appropriate HTTP status codes
 */
export function getStatusCode(error: unknown): number {
  if (error && typeof error === 'object' && 'statusCode' in error) {
    return (error as any).statusCode
  }
  
  if (error instanceof ZodError) {
    return 400
  }

  // Handle Prisma Database Errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': // Unique constraint
        return 409
      case 'P2003': // Foreign key constraint
      case 'P2020': // Value out of range
        return 400
      case 'P2001': // Record not found
      case 'P2025': // Record to update/delete not found
        return 404
      default:
        return 500
    }
  }
  
  if (error instanceof Error) {
    if (error.message.toLowerCase().includes('not found')) return 404
    if (error.message.toLowerCase().includes('unauthorized') || 
        error.message.toLowerCase().includes('authentication required')) return 401
    if (error.message.toLowerCase().includes('forbidden') || 
        error.message.toLowerCase().includes('insufficient permissions')) return 403
    if (error.message.toLowerCase().includes('duplicate') || 
        error.message.toLowerCase().includes('already exists')) return 409
    if (error.message.toLowerCase().includes('rate limit')) return 429
  }
  
  return 500
}

/**
 * Format error into consistent API response format
 */
export function formatErrorResponse(error: unknown): ApiErrorResponse {
  if (error instanceof ZodError) {
    return {
      error: 'Validation failed',
      details: error.issues,
      statusCode: 400
    }
  }
  
  if (error instanceof ValidationError) {
    return {
      error: error.message,
      details: error.details,
      statusCode: 400
    }
  }
  
  if (error instanceof AuthenticationError || 
      error instanceof AuthorizationError || 
      error instanceof NotFoundError || 
      error instanceof ConflictError || 
      error instanceof RateLimitError) {
    return {
      error: error.message,
      statusCode: error.statusCode
    }
  }

  // Handle Prisma Database Errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const statusCode = getStatusCode(error)
    let message = 'Database error'
    
    if (error.code === 'P2002') {
      const target = (error.meta?.target as string[])?.join(', ') || 'field'
      message = `A record with this ${target} already exists`
    } else if (error.code === 'P2003') {
      message = 'Invalid reference in data relations'
    } else if (error.code === 'P2025') {
      message = 'Resource not found'
    }
    
    return {
      error: message,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      statusCode
    }
  }
  
  if (error instanceof Error) {
    const statusCode = getStatusCode(error)
    
    if (statusCode === 500 && process.env.NODE_ENV === 'production') {
      return {
        error: 'Internal server error',
        statusCode: 500
      }
    }
    
    return {
      error: error.message,
      statusCode
    }
  }

  if (isRecord(error)) {
    const statusCode = getStatusCode(error)
    const message = getNonEmptyMessage(error)

    return {
      error: message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? serializeErrorForLog(error) : undefined,
      statusCode
    }
  }
  
  return {
    error: 'An unexpected error occurred',
    statusCode: 500
  }
}

/**
 * Handle API errors and return appropriate NextResponse
 */
export function handleApiError(error: unknown, logError: boolean = true): NextResponse {
  const errorResponse = formatErrorResponse(error)
  const statusCode = errorResponse.statusCode || 500
  
  if (logError && statusCode >= 500) {
    console.error('API Error:', serializeErrorForLog(error))
    if (process.env.NODE_ENV === 'development' && error instanceof Error) {
      console.error('Stack trace:', error.stack)
    }
  }
  
  const { statusCode: _, ...responseBody } = errorResponse
  
  return NextResponse.json(responseBody, { status: statusCode })
}

/**
 * Wrap async API route handlers with error handling
 */
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}
