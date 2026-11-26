import { z } from "zod"

export const expenseCategorySchema = z.object({
  name: z.string().min(2, "Category name is required"),
})

export const expenseCreateSchema = z.object({
  categoryId: z.string().cuid("Invalid category"),
  description: z.string().min(2, "Description is required"),
  amount: z.preprocess((v) => (typeof v === "string" ? parseFloat(v) : v), z.number().positive("Amount must be positive")),
  paymentMethod: z.string().min(1, "Payment method is required"),
  expenseDate: z.string().datetime().optional(),
  recordedById: z.preprocess((v) => (typeof v === "string" ? parseInt(v, 10) : v), z.number().int().positive()),
  receiptUrl: z.string().optional(),
})

export const expenseUpdateSchema = expenseCreateSchema.partial()

export const expenseQuerySchema = z.object({
  categoryId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.preprocess((v) => (typeof v === "string" ? parseInt(v, 10) : v), z.number().int().positive().default(1)),
  limit: z.preprocess((v) => (typeof v === "string" ? parseInt(v, 10) : v), z.number().int().positive().max(100).default(20)),
})
