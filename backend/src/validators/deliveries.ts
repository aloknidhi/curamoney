import { z } from "zod"

export const deliveryCreateSchema = z.object({
  orderId: z.string().cuid("Invalid order"),
  readyQuantity: z.preprocess((v) => (typeof v === "string" ? parseFloat(v) : v), z.number().nonnegative().default(0)),
  deliveredQuantity: z.preprocess((v) => (typeof v === "string" ? parseFloat(v) : v), z.number().nonnegative().default(0)),
  receiverName: z.string().optional(),
  receiverPhone: z.string().optional(),
  remarks: z.string().optional(),
  confirmed: z.preprocess((v) => v === true || v === "true", z.boolean().default(false)),
})

export const deliveryQuerySchema = z.object({
  orderId: z.string().optional(),
  page: z.preprocess((v) => (typeof v === "string" ? parseInt(v, 10) : v), z.number().int().positive().default(1)),
  limit: z.preprocess((v) => (typeof v === "string" ? parseInt(v, 10) : v), z.number().int().positive().max(100).default(20)),
})
