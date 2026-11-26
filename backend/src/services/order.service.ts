import { Prisma } from "@prisma/client"
import { prisma } from "../config/prisma"
import { createError } from "../middleware/error"
import { logActivity } from "./auth.service"
import { computeOrderTotals } from "../validators/orders"

// Valid status transitions (from -> allowed tos)
const VALID_TRANSITIONS: Record<string, string[]> = {
  ORDER_RECEIVED: ["WEIGHMENT_COMPLETED", "WAITING_IN_QUEUE", "ON_HOLD", "CANCELLED"],
  WEIGHMENT_COMPLETED: ["WAITING_IN_QUEUE", "ON_HOLD", "CANCELLED"],
  WAITING_IN_QUEUE: ["PROCESSING_STARTED", "ON_HOLD", "CANCELLED"],
  PROCESSING_STARTED: ["PROCESSING_COMPLETED", "ON_HOLD", "CANCELLED"],
  PROCESSING_COMPLETED: ["QUALITY_CHECK", "ON_HOLD"],
  QUALITY_CHECK: ["READY_FOR_DELIVERY", "ON_HOLD"],
  READY_FOR_DELIVERY: ["PARTIALLY_DELIVERED", "FULLY_DELIVERED", "ON_HOLD"],
  PARTIALLY_DELIVERED: ["FULLY_DELIVERED", "ON_HOLD"],
  FULLY_DELIVERED: ["CLOSED", "ON_HOLD"],
  ON_HOLD: ["ORDER_RECEIVED", "WEIGHMENT_COMPLETED", "WAITING_IN_QUEUE", "PROCESSING_STARTED", "CANCELLED"],
  CANCELLED: [],
  CLOSED: [],
}

export const isValidTransition = (from: string, to: string): boolean => {
  if (from === to) return true
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

const generateOrderId = async (): Promise<string> => {
  const year = new Date().getFullYear()
  const prefix = `CM-${year}-`
  const last = await prisma.order.findFirst({
    where: { orderId: { startsWith: prefix } },
    orderBy: { orderId: "desc" },
  })
  let seq = 1
  if (last) {
    const match = last.orderId.match(/-(\d+)$/)
    if (match) seq = parseInt(match[1], 10) + 1
  }
  return `${prefix}${String(seq).padStart(4, "0")}`
}

export const listOrders = async (query: any) => {
  const { search, status, customerId, startDate, endDate, page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = query
  const skip = (page - 1) * limit

  const where: any = {}
  if (search) {
    where.OR = [
      { orderId: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
      { customer: { mobile: { contains: search } } },
    ]
  }
  if (status) where.status = status
  if (customerId) where.customerId = customerId
  if (startDate || endDate) {
    where.orderDate = {}
    if (startDate) where.orderDate.gte = new Date(startDate)
    if (endDate) where.orderDate.lte = new Date(endDate)
  }

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        customer: { select: { id: true, customerId: true, name: true, mobile: true } },
        _count: { select: { payments: true, deliveries: true, weighments: true } },
      },
    }),
    prisma.order.count({ where }),
  ])

  return { data: orders, meta: { total, page, limit, pages: Math.ceil(total / limit) } }
}

export const getOrder = async (id: string) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: true,
      weighments: { orderBy: { recordedAt: "desc" } },
      production: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: { paymentDate: "desc" } },
      deliveries: { orderBy: { deliveryDate: "desc" } },
      statusHistory: {
        orderBy: { changedAt: "desc" },
        include: { updatedBy: { select: { name: true } } },
      },
    },
  })
  if (!order) throw createError("Order not found", 404, "ORDER_NOT_FOUND")
  return order
}

export const createOrder = async (data: any, userId: number) => {
  return await prisma.$transaction(async (tx) => {
    const orderId = await generateOrderId()
    const totals = computeOrderTotals({
      processingCharges: data.processingCharges,
      additionalCharges: data.additionalCharges,
      discount: data.discount,
      advancePayment: data.advancePayment,
      amountPaid: data.advancePayment,
    })

    // Ensure customer exists
    const customer = await tx.customer.findUnique({ where: { id: data.customerId } })
    if (!customer) throw createError("Customer not found", 404, "CUSTOMER_NOT_FOUND")

    const order = await tx.order.create({
      data: {
        orderId,
        customerId: data.customerId,
        orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
        expectedCompletion: data.expectedCompletionDate ? new Date(data.expectedCompletionDate) : null,
        materialType: data.materialType,
        quantity: data.quantity,
        weightUnit: data.weightUnit,
        bags: data.bags,
        ratePerUnit: data.ratePerUnit,
        processingCharges: data.processingCharges,
        additionalCharges: data.additionalCharges,
        discount: data.discount,
        subtotal: totals.subtotal,
        finalAmount: totals.finalAmount,
        amountPaid: totals.amountPaid,
        remainingBalance: totals.remainingBalance,
        specialInstructions: data.specialInstructions,
        status: "ORDER_RECEIVED",
        createdById: userId,
      },
    })

    // Status history
    await tx.orderStatusHistory.create({
      data: { orderId: order.id, newStatus: "ORDER_RECEIVED", updatedById: userId, remarks: "Order created" },
    })

    // Advance payment + ledger
    if (data.advancePayment && data.advancePayment > 0) {
      const payCount = await tx.payment.count()
      const year = new Date().getFullYear()
      const paymentId = `CM-PAY-${year}${String(payCount + 1).padStart(4, "0")}`
      await tx.payment.create({
        data: {
          paymentId,
          orderId: order.id,
          customerId: data.customerId,
          amount: data.advancePayment,
          paymentMethod: data.advancePaymentMethod || "CASH",
          transactionRef: data.advanceTransactionRef,
          remarks: data.advanceRemarks || "Advance payment",
          recordedById: userId,
        },
      })
      await tx.customerLedger.create({
        data: {
          customerId: data.customerId,
          orderId: order.id,
          type: "CREDIT",
          amount: data.advancePayment,
          balanceAfter: Number(customer.openingBalance) - data.advancePayment,
          reference: orderId,
        },
      })
    }

    // Opening ledger debit for final amount (charge)
    await tx.customerLedger.create({
      data: {
        customerId: data.customerId,
        orderId: order.id,
        type: "DEBIT",
        amount: totals.finalAmount,
        balanceAfter: Number(customer.openingBalance) + totals.finalAmount - (data.advancePayment || 0),
        reference: orderId,
      },
    })

    await logActivity(userId, "CREATE", "Order", order.id, null, order)
    return order
  })
}

export const updateOrder = async (id: string, data: any, userId: number) => {
  const existing = await prisma.order.findUnique({ where: { id } })
  if (!existing) throw createError("Order not found", 404, "ORDER_NOT_FOUND")
  if (existing.status === "CLOSED" || existing.status === "CANCELLED") {
    throw createError("Cannot modify a closed or cancelled order", 400, "ORDER_IMMUTABLE")
  }

  const totals = computeOrderTotals({
    processingCharges: Number(data.processingCharges ?? existing.processingCharges),
    additionalCharges: Number(data.additionalCharges ?? existing.additionalCharges),
    discount: Number(data.discount ?? existing.discount),
    advancePayment: 0,
    amountPaid: Number(existing.amountPaid),
  })

  const order = await prisma.order.update({
    where: { id },
    data: {
      materialType: data.materialType ?? existing.materialType,
      quantity: data.quantity ?? existing.quantity,
      weightUnit: data.weightUnit ?? existing.weightUnit,
      bags: data.bags ?? existing.bags,
      ratePerUnit: data.ratePerUnit ?? existing.ratePerUnit,
      processingCharges: data.processingCharges ?? existing.processingCharges,
      additionalCharges: data.additionalCharges ?? existing.additionalCharges,
      discount: data.discount ?? existing.discount,
      subtotal: totals.subtotal,
      finalAmount: totals.finalAmount,
      remainingBalance: totals.remainingBalance,
      specialInstructions: data.specialInstructions ?? existing.specialInstructions,
      expectedCompletion: data.expectedCompletionDate ? new Date(data.expectedCompletionDate) : existing.expectedCompletion,
    },
  })

  await logActivity(userId, "UPDATE", "Order", id, existing, order)
  return order
}

export const updateOrderStatus = async (id: string, newStatus: string, remarks: string | undefined, userId: number) => {
  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) throw createError("Order not found", 404, "ORDER_NOT_FOUND")
  if (order.status === "CLOSED") throw createError("Order is already closed", 400, "ORDER_CLOSED")
  if (order.status === "CANCELLED") throw createError("Order is cancelled", 400, "ORDER_CANCELLED")

  if (!isValidTransition(order.status, newStatus)) {
    throw createError(`Invalid status transition from ${order.status} to ${newStatus}`, 400, "INVALID_TRANSITION")
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: newStatus },
  })

  await prisma.orderStatusHistory.create({
    data: { orderId: id, previousStatus: order.status, newStatus, updatedById: userId, remarks },
  })

  await logActivity(userId, "UPDATE_STATUS", "Order", id, { status: order.status }, { status: newStatus })
  return updated
}

export const cancelOrder = async (id: string, reason: string, userId: number) => {
  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) throw createError("Order not found", 404, "ORDER_NOT_FOUND")
  if (order.status === "CLOSED") throw createError("Cannot close a cancelled order", 400, "ORDER_CLOSED")
  if (!isValidTransition(order.status, "CANCELLED")) {
    throw createError("Order cannot be cancelled at this stage", 400, "INVALID_TRANSITION")
  }

  const updated = await prisma.order.update({ where: { id }, data: { status: "CANCELLED" } })
  await prisma.orderStatusHistory.create({
    data: { orderId: id, previousStatus: order.status, newStatus: "CANCELLED", updatedById: userId, remarks: reason },
  })
  await logActivity(userId, "CANCEL", "Order", id, { status: order.status }, { status: "CANCELLED", reason })
  return updated
}

export const deleteOrder = async (id: string, userId: number) => {
  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) throw createError("Order not found", 404, "ORDER_NOT_FOUND")
  if (order.status !== "CANCELLED") {
    throw createError("Only cancelled orders can be deleted", 400, "ORDER_NOT_CANCELLED")
  }
  await prisma.order.delete({ where: { id } })
  await logActivity(userId, "DELETE", "Order", id, order, null)
  return { success: true }
}

export const getDashboardStats = async () => {
  const [
    totalOrders,
    todayOrders,
    pendingOrders,
    processingOrders,
    completedOrders,
    deliveredOrders,
    totalCustomers,
    todayRevenue,
    monthlyRevenue,
    outstanding,
    totalExpenses,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { orderDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    prisma.order.count({ where: { status: { in: ["ORDER_RECEIVED", "WEIGHMENT_COMPLETED", "WAITING_IN_QUEUE", "PROCESSING_STARTED", "PROCESSING_COMPLETED", "QUALITY_CHECK", "READY_FOR_DELIVERY", "PARTIALLY_DELIVERED"] } } }),
    prisma.order.count({ where: { status: { in: ["PROCESSING_STARTED", "PROCESSING_COMPLETED", "QUALITY_CHECK"] } } }),
    prisma.order.count({ where: { status: "FULLY_DELIVERED" } }),
    prisma.order.count({ where: { status: "FULLY_DELIVERED" } }),
    prisma.customer.count({ where: { isArchived: false } }),
    prisma.order.aggregate({ where: { orderDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }, _sum: { amountPaid: true } }),
    prisma.order.aggregate({ where: { orderDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }, _sum: { amountPaid: true } }),
    prisma.order.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { remainingBalance: true } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
  ])

  const netProfit = Number(todayRevenue._sum.amountPaid || 0) - Number(totalExpenses._sum.amount || 0)

  return {
    totalOrders,
    todayOrders,
    pendingOrders,
    processingOrders,
    completedOrders,
    deliveredOrders,
    totalCustomers,
    todayRevenue: Number(todayRevenue._sum.amountPaid || 0),
    monthlyRevenue: Number(monthlyRevenue._sum.amountPaid || 0),
    outstanding: Number(outstanding._sum.remainingBalance || 0),
    totalExpenses: Number(totalExpenses._sum.amount || 0),
    netOperatingProfit: netProfit,
  }
}

export const recentOrders = async (limit = 10) => {
  return prisma.order.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderId: true,
      orderDate: true,
      quantity: true,
      weightUnit: true,
      finalAmount: true,
      amountPaid: true,
      remainingBalance: true,
      status: true,
      customer: { select: { id: true, name: true, mobile: true } },
    },
  })
}

export const exportOrdersCsv = async () => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: { select: { name: true, mobile: true } } },
  })
  const header = "Order ID,Customer,Mobile,Order Date,Material,Quantity,Unit,Final Amount,Paid,Balance,Status\n"
  const rows = orders.map(
    (o) =>
      `${o.orderId},${o.customer.name},${o.customer.mobile},${o.orderDate},${o.materialType},${o.quantity},${o.weightUnit},${o.finalAmount},${o.amountPaid},${o.remainingBalance},${o.status}`
  )
  return header + rows.join("\n")
}
