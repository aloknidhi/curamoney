import { z } from "zod"

export const settingUpsertSchema = z.object({
  key: z.string().min(1, "Setting key is required"),
  value: z.string().min(1, "Setting value is required"),
  category: z.enum(["BUSINESS", "OPERATIONAL", "SYSTEM"]),
})

export const settingQuerySchema = z.object({
  category: z.string().optional(),
})
