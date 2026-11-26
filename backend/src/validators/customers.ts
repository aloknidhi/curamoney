import { z } from "zod"

const phoneSchema = z.string().min(10, "Enter a valid mobile number")

export const customerCreateSchema = z.object({
  name: z.string().min(2, "Customer name is required"),
  mobile: phoneSchema,
  altMobile: phoneSchema.optional().or(z.literal("")),
  village: z.string().optional(),
  district: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  openingBalance: z.preprocess(
    (v) => (v === undefined || v === "" ? 0 : Number(v)),
    z.number().nonnegative().default(0)
  ),
})

export const customerUpdateSchema = customerCreateSchema.partial()

export const customerQuerySchema = z.object({
  search: z.string().optional(),
  isArchived: z.preprocess(
    (v) => v === "true" || v === true,
    z.boolean().optional()
  ),
})
