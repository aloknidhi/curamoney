import { Request, Response, NextFunction } from "express"
import { ZodError } from "zod"
import { logger } from "../config/logger"

export interface AppError extends Error {
  statusCode?: number
  code?: string
}

export const createError = (message: string, statusCode: number, code?: string): AppError => {
  const err = new Error(message) as AppError
  err.statusCode = statusCode
  err.code = code
  return err
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500
  const code = err.code || "SERVER_ERROR"
  const message = err.message || "Internal server error"

  if (statusCode >= 500) {
    logger.error("Unhandled server error", err)
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        issues: err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      },
    })
    return
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  })
}
