import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { prisma } from "../config/prisma"
import { logger } from "../config/logger"

export interface AuthUser {
  id: number
  email: string
  name: string
  role: string
  roleId: number
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set")
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let token: string | undefined

  // Prefer HttpOnly cookie, fall back to Bearer header
  if (req.cookies?.token) {
    token = req.cookies.token
  } else {
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7)
    }
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    })
    return
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: number
      email: string
      role: string
      roleId: number
    }

    // Verify user still exists and is active
    const user = prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, roleId: true, isActive: true },
    })
    // NOTE: resolved inline below to avoid awaiting outside async context
    ;(async () => {
      const u = await user
      if (!u || !u.isActive) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "User inactive or not found" },
        })
        return
      }
      req.user = {
        id: u.id,
        email: u.email,
        name: u.name,
        role: payload.role,
        roleId: u.roleId,
      }
      next()
    })().catch((err) => {
      logger.error("Auth middleware error", err)
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Authentication failed" },
      })
    })
  } catch (err) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Invalid or expired token" },
    })
  }
}

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      })
      return
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Insufficient permissions" },
      })
      return
    }
    next()
  }
}

// Permission-based middleware: require a specific permission slug
export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      })
      return
    }
    const rolePermission = await prisma.rolePermission.findFirst({
      where: {
        roleId: req.user.roleId,
        permission: { name: permission },
      },
      include: { permission: true },
    })
    if (!rolePermission) {
      res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "You do not have permission to perform this action" },
      })
      return
    }
    next()
  }
}
