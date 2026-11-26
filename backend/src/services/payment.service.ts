import { Prisma } from "@prisma/client"
import { prisma } from "../config/prisma"
import { createError } from "../middleware/error"
import { logActivity } from "./auth.service"

const generatePaymentId = async (): Promise<string> => {
  const count = await prisma.payment.count()
  const year = new Date().getFullYear()
  return `CM-PAY-${year}${String(count + 1).padStart(4, "0")}`
}

export const listPayments = async (query: any) => {
  const { customerId, orderId, paymentMethod, startDate, endDate, page = 1, limit = 20 } = query
  const skip = (page - 1) * limit
  const where: any = { isReversed: false }
  if (customerId) where.customerId = customerId
  if (orderId) where.orderId = orderId
  if (paymentMethod) where.paymentMethod = paymentMethod
  if (startDate || endDate) {
    where.paymentDate = {}
    if (startDate) where.paymentDate.gte = new Date(startDate)
    if (endDate) where.paymentDate.lte = new Date(endDate)
  }

  const [payments, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { paymentDate: "desc" },
      include: {
        customer: { select: { id: true, customerId: true, name: true } },
        order: { select: { orderId: true } },
        recordedBy: { select: { name: true } },
      },
    }),
    prisma.payment.count({ where }),
  ])

  return { data: payments, meta: { total, page, limit, pages: Math.ceil(total / limit) } }
}

export const createPayment = async (data: any, userId: number) => {
  return await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({ where: { id: data.customerId } })
    if (!customer) throw createError("Customer not found", 404, "CUSTOMER_NOT_FOUND")

    const order = data.orderId ? await tx.order.findUnique({ where: { id: data.orderId } }) : null
    if (data.orderId && !order) throw createError("Order not found", 404, "ORDER_NOT_FOUND")

    const paymentId = await generatePaymentId()
    const paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date()

    const payment = await tx.payment.create({
      data: {
        paymentId,
        orderId: data.orderId || null,
        customerId: data.customerId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        transactionRef: data.transactionRef || null,
        remarks: data.remarks || null,
        paymentDate,
        recordedById: userId,
      },
      include: { recordedBy: { select: { name: true } }, customer: { select: { name: true, mobile: true } } },
    })

    // Update order amountPaid / remainingBalance
    if (order) {
      const newPaid = Number(order.amountPaid) + Number(data.amount)
      const newBalance = Math.max(0, Number(order.finalAmount) - newPaid)
      await tx.order.update({
        where: { id: data.orderId },
        data: { amountPaid: newPaid, remainingBalance: newBalance },
      })
    }

    // Customer ledger CREDIT entry
    const lastLedger = await tx.customerLedger.findFirst({
      where: { customerId: data.customerId },
      orderBy: { createdAt: "desc" },
    })
    const currentBalance = lastLedger ? Number(lastLedger.balanceAfter) : Number(customer.openingBalance)
    const newBalanceAfter = currentBalance - Number(data.amount)

    await tx.customerLedger.create({
      data: {
        customerId: data.customerId,
        orderId: data.orderId || null,
        paymentId: payment.id,
        type: "CREDIT",
        amount: data.amount,
        balanceAfter: newBalanceAfter,
        reference: paymentId,
      },
    })

    await logActivity(userId, "CREATE", "Payment", payment.id, null, payment)
    return payment
  })
}

export const getPayment = async (id: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { customer: true, order: { select: { orderId: true } }, recordedBy: { select: { name: true } } },
  })
  if (!payment) throw createError("Payment not found", 404, "PAYMENT_NOT_FOUND")
  return payment
}

export const reversePayment = async (id: string, reason: string, userId: number) => {
  return await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id } })
    if (!payment) throw createError("Payment not found", 404, "PAYMENT_NOT_FOUND")
    if (payment.isReversed) throw createError("Payment already reversed", 400, "ALREADY_REVERSED")

    // Mark original reversed
    await tx.payment.update({ where: { id }, data: { isReversed: true } })

    // Revert order amountPaid/balance if linked
    if (payment.orderId) {
      const order = await tx.order.findUnique({ where: { id: payment.orderId } })
      if (order) {
        const newPaid = Math.max(0, Number(order.amountPaid) - Number(payment.amount))
        const newBalance = Math.max(0, Number(order.finalAmount) - newPaid)
        await tx.order.update({ where: { id: payment.orderId }, data: { amountPaid: newPaid, remainingBalance: newBalance } })
      }
    }

    // Ledger reversal entry (DEBIT to offset the original CREDIT)
    const lastLedger = await tx.customerLedger.findFirst({
      where: { customerId: payment.customerId },
      orderBy: { createdAt: "desc" },
    })
    const currentBalance = lastLedger ? Number(lastLedger.balanceAfter) : 0
    const newBalanceAfter = currentBalance + Number(payment.amount)

    await tx.customerLedger.create({
      data: {
        customerId: payment.customerId,
        orderId: payment.orderId || null,
        paymentId: payment.paymentId,
        type: "DEBIT",
        amount: payment.amount,
        balanceAfter: newBalanceAfter,
        reference: `REVERSAL-${payment.paymentId}`,
      },
    })

    await tx.auditLog.create({
      data: {
        userId,
        action: "REVERSE",
        entity: "Payment",
        entityId: id,
        oldValues: null,
        newValues: JSON.stringify({ paymentId: payment.paymentId, reason, reversedAt: new Date() }),
      },
    })

    return { success: true, paymentId: payment.paymentId }
  })
}

export const getDailyCollections = async () => {
  const today = new Date(new Date().setHours(0, 0, 0, 0))
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
  const payments = await prisma.payment.aggregate({
    where: { isReversed: false, paymentDate: { gte: today, lt: tomorrow } },
    _sum: { amount: true },
    _count: { id: true },
  })
  return {
    date: today.toISOString().split("T")[0],
    total: Number(payments._sum.amount || 0),
    count: payments._count.id,
  }
}

export const getMonthlyCollections = async () => {
  const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const end = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
  const payments = await prisma.payment.aggregate({
    where: { isReversed: false, paymentDate: { gte: start, lt: end } },
    _sum: { amount: true },
  })
  return { month: start.toISOString().split("T")[0], total: Number(payments._sum.amount || 0) }
}
