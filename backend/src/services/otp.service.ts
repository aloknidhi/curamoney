import { prisma } from "../config/prisma"
import { createError } from "../middleware/error"
import { logger } from "../config/logger"

const OTP_LENGTH = 6
const OTP_EXPIRY_MINUTES = 10
const MAX_OTP_REQUESTS_PER_HOUR = 3

export type OtpPurpose = "SIGNUP" | "LOGIN" | "FORGOT_PASSWORD"

export function generateOtp(): string {
  let otp = ""
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += Math.floor(Math.random() * 10)
  }
  return otp
}

export async function sendOtp(
  email?: string,
  mobile?: string,
  purpose: OtpPurpose = "SIGNUP"
): Promise<{ identifier: string; expiresIn: number }> {
  const identifier = email || mobile
  if (!identifier) {
    throw createError("Email or mobile is required", 400, "IDENTIFIER_REQUIRED")
  }

  // Rate limit: max requests per hour per identifier
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recentCount = await prisma.otpToken.count({
    where: {
      email: email ?? undefined,
      mobile: mobile ?? undefined,
      purpose,
      createdAt: { gte: oneHourAgo },
    },
  })
  if (recentCount >= MAX_OTP_REQUESTS_PER_HOUR) {
    throw createError(
      "Too many OTP requests. Please try again after an hour.",
      429,
      "OTP_RATE_LIMITED"
    )
  }

  // Invalidate any previous unused OTPs for this identifier + purpose
  await prisma.otpToken.updateMany({
    where: {
      email: email ?? undefined,
      mobile: mobile ?? undefined,
      purpose,
      used: false,
    },
    data: { used: true },
  })

  const otp = generateOtp()
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

  await prisma.otpToken.create({
    data: {
      email: email ?? null,
      mobile: mobile ?? null,
      otp,
      purpose,
      expiresAt,
    },
  })

  // Deliver OTP — dev: console.log. Production: configure nodemailer/SMS provider.
  const message = `Your CuraMoney OTP is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`
  if (email) {
    logger.info(`[OTP] Email: ${email} | Purpose: ${purpose} | OTP: ${otp}`)
    await sendOtpEmail(email, otp, purpose)
  }
  if (mobile) {
    logger.info(`[OTP] Mobile: ${mobile} | Purpose: ${purpose} | OTP: ${otp}`)
  }

  return { identifier, expiresIn: OTP_EXPIRY_MINUTES * 60 }
}

async function sendOtpEmail(email: string, otp: string, purpose: OtpPurpose): Promise<void> {
  try {
    const nodemailer = await import("nodemailer")
    const host = process.env.SMTP_HOST
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS

    if (!host || !user || !pass) {
      // No SMTP configured — OTP already logged above. In dev this is sufficient.
      logger.warn("[OTP] SMTP not configured — OTP delivered via server logs only")
      return
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })

    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@curamoney.com",
      to: email,
      subject: `CuraMoney OTP — ${purpose}`,
      text: `Your OTP code is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
      html: `<p>Your CuraMoney OTP code is <b>${otp}</b>. It expires in ${OTP_EXPIRY_MINUTES} minutes.</p>`,
    })
  } catch (err) {
    logger.error("Failed to send OTP email", err)
    // Don't throw — OTP is already stored and logged, user can still use it from logs in dev
  }
}

export async function verifyOtp(
  email?: string,
  mobile?: string,
  otp?: string,
  purpose: OtpPurpose = "SIGNUP"
): Promise<boolean> {
  const identifier = email || mobile
  if (!identifier || !otp) {
    throw createError("Email/mobile and OTP are required", 400, "MISSING_FIELDS")
  }

  const token = await prisma.otpToken.findFirst({
    where: {
      email: email ?? undefined,
      mobile: mobile ?? undefined,
      purpose,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  })

  if (!token) {
    throw createError("Invalid or expired OTP", 400, "INVALID_OTP")
  }

  if (token.otp !== otp) {
    throw createError("Incorrect OTP", 400, "INCORRECT_OTP")
  }

  await prisma.otpToken.update({
    where: { id: token.id },
    data: { used: true },
  })

  return true
}

export async function cleanupExpiredOtps(): Promise<void> {
  await prisma.otpToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
}
