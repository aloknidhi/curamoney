import { prisma } from "../config/prisma"
import { createError } from "../middleware/error"
import { logActivity } from "./auth.service"

const generateDeliveryId = async (): Promise<string> => {
  const count = await prisma.delivery.count()
  const year = new Date().getFullYear()
  return `CM-DEL-${year}${String(count + 1).padStart(4, "0")}`
}

export const createDelivery = async (data: any, userId: number) => {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: data.orderId } })
    if (!order) throw createError("Order not found", 404, "ORDER_NOT_FOUND")

    // Sum existing delivered quantity for this order
    const existing = await tx.delivery.aggregate({
      where: { orderId: data.orderId },
      _sum: { deliveredQuantity: true },
    })
    const alreadyDelivered = Number(existing._sum.deliveredQuantity || 0)
    const newDelivered = alreadyDelivered + Number(data.deliveredQuantity)

    // Ready quantity = finished verified quantity from weighments, or 0
    const weighments = await tx.weighmentRecord.aggregate({
      where: { orderId: data.orderId },
      _sum: { finalVerifiedQty: true },
    })
    const readyQuantity = Number(weighments._sum.finalVerifiedQty || 0)

    const remainingQuantity = Math.max(0, readyQuantity - newDelivered)
    if (Number(data.deliveredQuantity) > readyQuantity - alreadyDelivered) {
      throw createError("Delivered quantity exceeds ready quantity", 400, "EXCEEDS_READY_QTY")
    }

    const deliveryId = await generateDeliveryId()
    const delivery = await tx.delivery.create({
      data: {
        deliveryId,
        orderId: data.orderId,
        readyQuantity,
        deliveredQuantity: Number(data.deliveredQuantity),
        remainingQuantity,
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : new Date(),
        receiverName: data.receiverName || null,
        receiverPhone: data.receiverPhone || null,
        remarks: data.remarks || null,
        confirmed: data.confirmed ?? false,
        createdById: userId,
      },
      include: { createdBy: { select: { name: true } } },
    })

    // Update order status based on delivery
    if (remainingQuantity === 0 && readyQuantity > 0) {
      await tx.order.update({ where: { id: data.orderId }, data: { status: "FULLY_DELIVERED" } })
      await tx.orderStatusHistory.create({
        data: {
          orderId: data.orderId,
          previousStatus: order.status,
          newStatus: "FULLY_DELIVERED",
          updatedById: userId,
          remarks: "Order fully delivered",
        },
      })
    } else if (newDelivered > 0) {
      await tx.order.update({ where: { id: data.orderId }, data: { status: "PARTIALLY_DELIVERED" } })
      await tx.orderStatusHistory.create({
        data: {
          orderId: data.orderId,
          previousStatus: order.status,
          newStatus: "PARTIALLY_DELIVERED",
          updatedById: userId,
          remarks: "Partial delivery recorded",
        },
      })
    }

    await logActivity(userId, "CREATE", "Delivery", delivery.id, null, delivery)
    return { delivery, readyQuantity, remainingQuantity }
  })
}

export const listDeliveries = async (query: any) => {
  const { orderId, page = 1, limit = 20 } = query
  const skip = (page - 1) * limit
  const where: any = {}
  if (orderId) {
    const order = await prisma.order.findFirst({ where: { orderId }, select: { id: true } })
    if (!order) return { data: [], meta: { total: 0, page, limit, pages: 0 } }
    where.orderId = order.id
  }

  const [deliveries, total] = await prisma.$transaction([
    prisma.delivery.findMany({
      where,
      skip,
      take: limit,
      orderBy: { deliveryDate: "desc" },
      include: {
        order: { select: { orderId: true, customer: { select: { name: true } } } },
        createdBy: { select: { name: true } },
      },
    }),
    prisma.delivery.count({ where }),
  ])

  return { data: deliveries, meta: { total, page, limit, pages: Math.ceil(total / limit) } }
}

export const getDelivery = async (id: string) => {
  const delivery = await prisma.delivery.findUnique({
    where: { id },
    include: { order: { include: { customer: true } }, createdBy: { select: { name: true } } },
  })
  if (!delivery) throw createError("Delivery not found", 404, "DELIVERY_NOT_FOUND")
  return delivery
}
