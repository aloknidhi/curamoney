import { Prisma } from "@prisma/client"
import { prisma } from "../config/prisma"
import { createError } from "../middleware/error"
import { logActivity } from "./auth.service"
import { computeYield } from "../validators/processing"

export const listProcessing = async (query: any) => {
  const { orderId, page = 1, limit = 20 } = query
  const skip = (page - 1) * limit
  const where: any = {}
  if (orderId) {
    const order = await prisma.order.findFirst({ where: { orderId }, select: { id: true } })
    if (!order) return { data: [], meta: { total: 0, page, limit, pages: 0 } }
    where.orderId = order.id
  }

  const [records, total] = await prisma.$transaction([
    prisma.weighmentRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: { recordedAt: "desc" },
      include: {
        order: { select: { orderId: true, customer: { select: { name: true } } } },
        recordedBy: { select: { name: true } },
      },
    }),
    prisma.weighmentRecord.count({ where }),
  ])

  return { data: records, meta: { total, page, limit, pages: Math.ceil(total / limit) } }
}

export const createWeighment = async (data: any, userId: number) => {
  const order = await prisma.order.findUnique({ where: { id: data.orderId } })
  if (!order) throw createError("Order not found", 404, "ORDER_NOT_FOUND")
  if (order.status === "CLOSED" || order.status === "CANCELLED") {
    throw createError("Cannot record weighment for closed/cancelled order", 400, "ORDER_IMMUTABLE")
  }

  const yieldPct = computeYield(data.inputWeight, data.weightUnit, data.finishedWeight)

  const record = await prisma.weighmentRecord.create({
    data: {
      orderId: data.orderId,
      batchNumber: data.batchNumber,
      inputWeight: data.inputWeight,
      weightUnit: data.weightUnit,
      bags: data.bags,
      weightBeforeProcessing: data.weightBeforeProcessing ?? null,
      finishedWeight: data.finishedWeight ?? null,
      brokenQty: data.brokenQty,
      byProductQty: data.byProductQty,
      wastageQty: data.wastageQty,
      finalVerifiedQty: data.finalVerifiedQty ?? null,
      yieldPercent: yieldPct ?? null,
      qualityRemarks: data.qualityRemarks,
      productionNotes: data.productionNotes,
      recordedById: userId,
    },
    include: { recordedBy: { select: { name: true } } },
  })

  // Move order to WEIGHMENT_COMPLETED if it's still ORDER_RECEIVED
  if (order.status === "ORDER_RECEIVED") {
    await prisma.order.update({ where: { id: data.orderId }, data: { status: "WEIGHMENT_COMPLETED" } })
    await prisma.orderStatusHistory.create({
      data: { orderId: data.orderId, previousStatus: order.status, newStatus: "WEIGHMENT_COMPLETED", updatedById: userId, remarks: "Weighment recorded" },
    })
  }

  await logActivity(userId, "CREATE", "WeighmentRecord", record.id, null, record)
  return record
}

export const listWeighments = async (orderId: string) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw createError("Order not found", 404, "ORDER_NOT_FOUND")
  return prisma.weighmentRecord.findMany({
    where: { orderId },
    orderBy: { recordedAt: "asc" },
    include: { recordedBy: { select: { name: true } } },
  })
}

export const createOrUpdateProduction = async (data: any, userId: number) => {
  const order = await prisma.order.findUnique({ where: { id: data.orderId } })
  if (!order) throw createError("Order not found", 404, "ORDER_NOT_FOUND")

  const existing = await prisma.productionRecord.findFirst({ where: { orderId: data.orderId } })

  if (existing) {
    const record = await prisma.productionRecord.update({
      where: { id: existing.id },
      data: {
        processingStart: data.processingStart ? new Date(data.processingStart) : undefined,
        processingEnd: data.processingEnd ? new Date(data.processingEnd) : undefined,
        operatorName: data.operatorName,
        machineInfo: data.machineInfo,
        qualityRemarks: data.qualityRemarks,
        productionNotes: data.productionNotes,
      },
      include: { order: { select: { orderId: true } } },
    })
    return record
  }

  const record = await prisma.productionRecord.create({
    data: {
      orderId: data.orderId,
      processingStart: data.processingStart ? new Date(data.processingStart) : undefined,
      processingEnd: data.processingEnd ? new Date(data.processingEnd) : undefined,
      operatorName: data.operatorName,
      machineInfo: data.machineInfo,
      qualityRemarks: data.qualityRemarks,
      productionNotes: data.productionNotes,
      createdById: userId,
    },
    include: { order: { select: { orderId: true } } },
  })

  return record
}

export const getProduction = async (orderId: string) => {
  return prisma.productionRecord.findFirst({ where: { orderId } })
}
