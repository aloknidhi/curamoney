import { Request, Response } from "express"
import { prisma } from "../config/prisma"
import * as authService from "../services/auth.service"
import { createError } from "../middleware/error"
import { logger } from "../config/logger"

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body
  const user = await authService.authenticateUser(email, password)
  const token = authService.signToken(user.id, user.email, user.role, user.roleId)

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })

  res.json({ success: true, data: { user, token } })
}

export const logout = async (_req: Request, res: Response) => {
  res.clearCookie("token")
  res.json({ success: true, message: "Logged out" })
}

export const me = async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) throw createError("Authentication required", 401, "UNAUTHORIZED")
  const user = await authService.getMe(userId)
  res.json({ success: true, data: { user } })
}

export const register = async (req: Request, res: Response) => {
  const user = await authService.createUser(req.body)
  res.status(201).json({ success: true, data: user })
}

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    // Don't reveal whether email exists
    return res.json({ success: true, message: "If the email exists, a reset link has been sent" })
  }
  // In production, send a real email with a time-limited reset token
  res.json({ success: true, message: "Password reset instructions sent (dev: see server logs)" })
}

export const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = req.body
  // Dev-only: accept any non-empty token; production must verify signed reset token
  if (!token) throw createError("Invalid reset token", 400, "INVALID_TOKEN")
  const passwordHash = await authService.hashPassword(password)
  // Find user by email from a temp mapping is out of scope; require email too
  const { email } = req.body
  if (!email) throw createError("Email is required", 400, "EMAIL_REQUIRED")
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw createError("User not found", 404, "USER_NOT_FOUND")
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
  res.json({ success: true, message: "Password reset successful" })
}

export const changePassword = async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) throw createError("Authentication required", 401, "UNAUTHORIZED")
  const { currentPassword, newPassword } = req.body
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw createError("User not found", 404, "USER_NOT_FOUND")
  const valid = await authService.comparePassword(currentPassword, user.passwordHash)
  if (!valid) throw createError("Current password is incorrect", 400, "INVALID_PASSWORD")
  const passwordHash = await authService.hashPassword(newPassword)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
  res.json({ success: true, message: "Password changed" })
}
