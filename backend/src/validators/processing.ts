import { z } from "zod"
import { weightUnitSchema, toKg } from "./shared"

export const weighmentCreateSchema = z.object({
  orderId: z.string().cuid("Invalid order"),
  batchNumber: z.preprocess((v) => (typeof v === "string" ? parseInt(v, 10) : v), z.number().int().positive().default(1)),
  inputWeight: z.preprocess((v) => (typeof v === "string" ? parseFloat(v) : v), z.number().positive("Input weight must be positive")),
  weightUnit: weightUnitSchema,
  bags: z.preprocess((v) => (typeof v === "string" ? parseInt(v, 10) : v), z.number().int().positive().default(1)),
  weightBeforeProcessing: z.preprocess(
    (v) => (v === undefined || v === "" ? null : Number(v)),
    z.number().nonnegative().optional()
  ),
  finishedWeight: z.preprocess(
    (v) => (v === undefined || v === "" ? null : Number(v)),
    z.number().nonnegative().optional()
  ),
  brokenQty: z.preprocess((v) => (typeof v === "string" ? parseFloat(v) : v), z.number().nonnegative().default(0)),
  byProductQty: z.preprocess((v) => (typeof v === "string" ? parseFloat(v) : v), z.number().nonnegative().default(0)),
  wastageQty: z.preprocess((v) => (typeof v === "string" ? parseFloat(v) : v), z.number().nonnegative().default(0)),
  finalVerifiedQty: z.preprocess(
    (v) => (v === undefined || v === "" ? null : Number(v)),
    z.number().nonnegative().optional()
  ),
  qualityRemarks: z.string().optional(),
  productionNotes: z.string().optional(),
})

export const weighmentQuerySchema = z.object({
  orderId: z.string().optional(),
  page: z.preprocess((v) => (typeof v === "string" ? parseInt(v, 10) : v), z.number().int().positive().default(1)),
  limit: z.preprocess((v) => (typeof v === "string" ? parseInt(v, 10) : v), z.number().int().positive().max(100).default(20)),
})

export const productionRecordSchema = z.object({
  orderId: z.string().cuid("Invalid order"),
  processingStart: z.string().datetime().optional(),
  processingEnd: z.string().datetime().optional(),
  operatorName: z.string().optional(),
  machineInfo: z.string().optional(),
  qualityRemarks: z.string().optional(),
  productionNotes: z.string().optional(),
})

// Compute production yield %
export const computeYield = (inputWeight: number, unit: string, finishedWeight?: number | null) => {
  if (!finishedWeight) return null
  const inputKg = toKg(inputWeight, unit)
  if (inputKg <= 0) return null
  return Number(((finishedWeight / inputKg) * 100).toFixed(2))
}
