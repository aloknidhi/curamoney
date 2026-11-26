import { prisma } from "../config/prisma"
import { createError } from "../middleware/error"

export const listSettings = async (category?: string) => {
  const where = category ? { category } : {}
  return prisma.businessSetting.findMany({ where, orderBy: { category: "asc", key: "asc" } })
}

export const getSetting = async (key: string) => {
  const s = await prisma.businessSetting.findUnique({ where: { key } })
  if (!s) throw createError("Setting not found", 404, "SETTING_NOT_FOUND")
  return s.value
}

export const upsertSetting = async (data: any) => {
  const existing = await prisma.businessSetting.findUnique({ where: { key: data.key } })
  if (existing) {
    return prisma.businessSetting.update({
      where: { key: data.key },
      data: { value: data.value, category: data.category },
    })
  }
  return prisma.businessSetting.create({
    data: { key: data.key, value: data.value, category: data.category },
  })
}

export const bulkUpsertSettings = async (settings: any[]) => {
  const results = []
  for (const s of settings) {
    results.push(await upsertSetting(s))
  }
  return results
}
