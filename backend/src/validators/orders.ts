import { z } from "zod"
import { weightUnitSchema, WEIGHT_TO_KG } from "./shared"

const orderBase = z.object({
  customerId: z.string().cuid("Invalid customer"),
  orderDate: z.string().datetime().optional(),
  expectedCompletionDate: z.string().datetime().optional(),
  materialType: z.string().min(1, "Material type is required"),
  quantity: z.preprocess((v) => (typeof v === "string" ? parseFloat(v) : v), z.number().positive("Quantity must be positive")),
  weightUnit: weightUnitSchema,
  bags: z.preprocess((v) => (typeof v === "string" ? parseInt(v, 10) : v), z.number().int().positive().default(1)),
  ratePerUnit: z.preprocess((v) => (typeof v === "string" ? parseFloat(v) : v), z.number().nonnegative().default(0)),
  processingCharges: z.preprocess((v) => (typeof v === "string" ? parseFloat(v) : v), z.number().nonnegative().default(0)),
  additionalCharges: z.preprocess((v) => (typeof v === "string" ? parseFloat(v) : v), z.number().nonnegative().default(0)),
  discount: z.preprocess((v) => (typeof v === "string" ? parseFloat(v) : v), z.number().nonnegative().default(0)),
  advancePayment: z.preprocess((v) => (typeof v === "string" ? parseFloat(v) : v), z.number().nonnegative().default(0)),
  specialInstructions: z.string().optional(),
})

// Compute derived monetary fields server-side
export const orderCreateSchema = orderBase.refine(
  (data) => {
    const subtotal = data.processingCharges + data.additionalCharges
    const finalAmount = subtotal - data.discount
    return finalAmount >= 0
  },
  {
    message: "Discount cannot exceed subtotal",
    path: ["discount"],
  }
)

export const orderUpdateSchema = orderBase.partial()

export const orderQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  customerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.preprocess((v) => (typeof v === "string" ? parseInt(v, 10) : v), z.number().int().positive().default(1)),
  limit: z.preprocess((v) => (typeof v === "string" ? parseInt(v, 10) : v), z.number().int().positive().max(100).default(20)),
})

export const orderStatusUpdateSchema = z.object({
  newStatus: z.string().min(1, "Status is required"),
  remarks: z.string().optional(),
})

export const orderCancelSchema = z.object({
  reason: z.string().min(1, "Cancellation reason is required"),
})

export const orderIdParamSchema = z.object({
  id: z.string().cuid("Invalid order ID"),
})

// Helper: compute order money fields
export const computeOrderTotals = (data: {
  processingCharges: number
  additionalCharges: number
  discount: number
  advancePayment: number
  amountPaid?: number
}) => {
  const subtotal = Number(data.processingCharges) + Number(data.additionalCharges)
  const finalAmount = subtotal - Number(data.discount)
  const amountPaid = Number(data.amountPaid ?? 0)
  const remainingBalance = Math.max(0, finalAmount - amountPaid)
  return { subtotal, finalAmount, amountPaid, remainingBalance }
}
