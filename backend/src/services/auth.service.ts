import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { prisma } from "../config/prisma"
import { logger } from "../config/logger"
import type { StringValue } from "ms"
import { createError } from "../middleware/error"

const JWT_SECRET = process.env.JWT_SECRET as string
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d") as string

if (!JWT_SECRET) throw new Error("JWT_SECRET is not set")

export const signToken = (userId: number, email: string, role: string, roleId: number): string => {
  return jwt.sign({ userId, email, role, roleId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as StringValue })
}

export const hashPassword = (password: string): Promise<string> => bcrypt.hash(password, 12)
export const comparePassword = (plain: string, hash: string): Promise<boolean> => bcrypt.compare(plain, hash)

export interface AuthUser {
  id: number
  email: string
  name: string
  role: string
  roleId: number
}

export const authenticateUser = async (email: string, password: string): Promise<AuthUser> => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  })
  if (!user || !user.isActive) {
    throw createError("Invalid email or password", 401, "INVALID_CREDENTIALS")
  }
  const valid = await comparePassword(password, user.passwordHash)
  if (!valid) {
    throw createError("Invalid email or password", 401, "INVALID_CREDENTIALS")
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role.name,
    roleId: user.roleId,
  }
}

export const createUser = async (data: {
  email: string
  password: string
  name: string
  mobile?: string
  roleId: number
}) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) {
    throw createError("Email already registered", 409, "EMAIL_EXISTS")
  }
  const passwordHash = await hashPassword(data.password)
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      mobile: data.mobile,
      roleId: data.roleId,
    },
    include: { role: true },
  })
  return { id: user.id, email: user.email, name: user.name, role: user.role.name }
}

export const getMe = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, mobile: true, isActive: true, role: { select: { name: true } }, createdAt: true },
  })
  if (!user) throw createError("User not found", 404, "USER_NOT_FOUND")
  return user
}

export const logActivity = async (userId: number | undefined, action: string, entity: string, entityId: string | undefined, oldValues: any, newValues: any) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
      },
    })
  } catch (err) {
    logger.error("Audit log failed", err)
  }
}
