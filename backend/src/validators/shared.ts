import { z } from "zod"

// Common reusable schemas
export const uuidSchema = z.string().cuid("Invalid identifier")
export const positiveDecimal = z
  .preprocess(
    (val) => (typeof val === "string" ? parseFloat(val) : val),
    z.number().nonnegative("Must be a non-negative number")
  )
  .optional()

export const paginationSchema = z.object({
  page: z.preprocess((v) => (typeof v === "string" ? parseInt(v, 10) : v), z.number().int().positive().default(1)),
  limit: z.preprocess((v) => (typeof v === "string" ? parseInt(v, 10) : v), z.number().int().positive().max(100).default(20)),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

export const dateRangeSchema = z.object({
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
})

export const weightUnitSchema = z.enum(["KG", "QUINTAL", "TONNE"])
export const paymentMethodSchema = z.enum(["CASH", "UPI", "BANK_TRANSFER", "OTHER"])

// Conversion factors to kilograms
export const WEIGHT_TO_KG: Record<string, number> = {
  KG: 1,
  QUINTAL: 100,
  TONNE: 1000,
}

export const toKg = (value: number, unit: string): number => {
  const factor = WEIGHT_TO_KG[unit.toUpperCase()]
  if (!factor) throw new Error(`Unsupported weight unit: ${unit}`)
  return value * factor
}

export const fromKg = (kg: number, unit: string): number => {
  const factor = WEIGHT_TO_KG[unit.toUpperCase()]
  if (!factor) throw new Error(`Unsupported weight unit: ${unit}`)
  return kg / factor
}
