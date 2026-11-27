import { Request, Response } from "express"
import * as otpService from "../services/otp.service"
import { createError } from "../middleware/error"
import { logger } from "../config/logger"
import { prisma } from "../config/prisma"
import * as authService from "../services/auth.service"
import { signToken } from "../services/auth.service"

export const sendOtp = async (req: Request, res: Response) => {
  const { email, mobile, purpose } = req.body as {
    email?: string
    mobile?: string
    purpose?: "SIGNUP" | "LOGIN" | "FORGOT_PASSWORD"
  }

  const result = await otpService.sendOtp(email, mobile, purpose || "SIGNUP")
  res.json({
    success: true,
    message: `OTP sent to ${email || mobile}`,
    data: result,
  })
}

export const verifyOtp = async (req: Request, res: Response) => {
  const { email, mobile, otp, purpose } = req.body as {
    email?: string
    mobile?: string
    otp: string
    purpose?: "SIGNUP" | "LOGIN" | "FORGOT_PASSWORD"
  }

  const valid = await otpService.verifyOtp(email, mobile, otp, purpose || "SIGNUP")
  res.json({
    success: true,
    message: "OTP verified successfully",
    data: { verified: true },
  })
}

export const signup = async (req: Request, res: Response) => {
  const { email, password, name, mobile, otp, roleId } = req.body as {
    email: string
    password: string
    name: string
    mobile?: string
    otp: string
    roleId?: number
  }

  if (!email || !password || !name || !otp) {
    throw createError("Email, password, name and OTP are required", 400, "MISSING_FIELDS")
  }

  // Verify OTP for signup purpose
  const valid = await otpService.verifyOtp(email, undefined, otp, "SIGNUP")
  if (!valid) {
    throw createError("OTP verification failed", 400, "OTP_VERIFICATION_FAILED")
  }

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw createError("Email already registered", 409, "EMAIL_EXISTS")
  }

  // Find default role (OPERATOR) or use provided roleId
  let targetRoleId = roleId
  if (!targetRoleId) {
    const defaultRole = await prisma.role.findFirst({
      where: { name: "OPERATOR", isActive: true },
    })
    if (!defaultRole) {
      throw createError("No default role available", 500, "ROLE_NOT_FOUND")
    }
    targetRoleId = defaultRole.id
  }

  const user = await authService.createUser({
    email,
    password,
    name,
    mobile,
    roleId: targetRoleId,
  })

  const token = signToken(user.id, user.email, user.role, targetRoleId)

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })

  logger.info("New user signup", { email, userId: user.id, roleId: targetRoleId })

  res.status(201).json({
    success: true,
    message: "Account created successfully",
    data: { user, token },
  })
}

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body as { email: string }
  if (!email) {
    throw createError("Email is required", 400, "EMAIL_REQUIRED")
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    // Don't reveal whether email exists
    return res.json({
      success: true,
      message: "If the email exists, an OTP has been sent",
    })
  }

  await otpService.sendOtp(email, undefined, "FORGOT_PASSWORD")
  res.json({
    success: true,
    message: "OTP sent to your email",
  })
}

export const resetPassword = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body as {
    email: string
    otp: string
    newPassword: string
  }

  if (!email || !otp || !newPassword) {
    throw createError("Email, OTP and new password are required", 400, "MISSING_FIELDS")
  }

  if (newPassword.length < 6) {
    throw createError("Password must be at least 6 characters", 400, "WEAK_PASSWORD")
  }

  const valid = await otpService.verifyOtp(email, undefined, otp, "FORGOT_PASSWORD")
  if (!valid) {
    throw createError("OTP verification failed", 400, "OTP_VERIFICATION_FAILED")
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw createError("User not found", 404, "USER_NOT_FOUND")
  }

  const passwordHash = await authService.hashPassword(newPassword)
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })

  res.json({ success: true, message: "Password reset successful" })
}
