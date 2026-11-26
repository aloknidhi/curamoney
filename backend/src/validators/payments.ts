import { z } from "zod"
import { paymentMethodSchema } from "./shared"

export const paymentCreateSchema = z.object({
  orderId: z.string().cuid("Invalid order").optional(),
  customerId: z.string().cuid("Invalid customer"),
  amount: z.preprocess((v) => (typeof v === "string" ? parseFloat(v) : v), z.number().positive("Amount must be positive")),
  paymentMethod: paymentMethodSchema,
  transactionRef: z.string().optional(),
  paymentDate: z.string().datetime().optional(),
  remarks: z.string().optional(),
})

export const paymentQuerySchema = z.object({
  customerId: z.string().optional(),
  orderId: z.string().optional(),
  paymentMethod: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.preprocess((v) => (typeof v === "string" ? parseInt(v, 10) : v), z.number().int().positive().default(1)),
  limit: z.preprocess((v) => (typeof v === "string" ? parseInt(v, 10) : v), z.number().int().positive().max(100).default(20)),
})

export const paymentReverseSchema = z.object({
  reason: z.string().min(1, "Reversal reason is required"),
})

export const paymentIdParamSchema = z.object({
  id: z.string().cuid("Invalid payment ID"),
})
