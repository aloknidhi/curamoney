import { z } from "zod"

export const sendOtpSchema = z.object({
  email: z.string().email("Enter a valid email address").optional(),
  mobile: z.string().optional(),
  purpose: z.enum(["SIGNUP", "LOGIN", "FORGOT_PASSWORD"]).default("SIGNUP"),
})

export const verifyOtpSchema = z.object({
  email: z.string().email("Enter a valid email address").optional(),
  mobile: z.string().optional(),
  otp: z.string().length(6, "OTP must be 6 digits"),
  purpose: z.enum(["SIGNUP", "LOGIN", "FORGOT_PASSWORD"]).default("SIGNUP"),
})

export const signupSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  mobile: z.string().optional(),
  otp: z.string().length(6, "OTP must be 6 digits"),
  roleId: z.preprocess(
    (v) => (typeof v === "string" ? parseInt(v, 10) : v),
    z.number().int().positive().optional()
  ),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
})

export const resetPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
})
