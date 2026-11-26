import { prisma } from "../config/prisma"
import { createError } from "../middleware/error"
import { logActivity } from "./auth.service"

export const listCustomers = async (query: any, userId: number) => {
  const { search, isArchived, page = 1, limit = 20 } = query
  const skip = (page - 1) * limit

  const where: any = {}
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { mobile: { contains: search } },
      { customerId: { contains: search } },
      { village: { contains: search, mode: "insensitive" } },
    ]
  }
  if (isArchived !== undefined) where.isArchived = isArchived

  const [customers, total] = await prisma.$transaction([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { orders: true, payments: true } },
      },
    }),
    prisma.customer.count({ where }),
  ])

  return { data: customers, meta: { total, page, limit, pages: Math.ceil(total / limit) } }
}

export const getCustomer = async (id: string) => {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      _count: { select: { orders: true, payments: true } },
      orders: {
        orderBy: { orderDate: "desc" },
        take: 10,
        select: { id: true, orderId: true, orderDate: true, status: true, finalAmount: true, amountPaid: true, remainingBalance: true },
      },
    },
  })
  if (!customer) throw createError("Customer not found", 404, "CUSTOMER_NOT_FOUND")
  return customer
}

export const createCustomer = async (data: any, userId: number) => {
  // Duplicate phone warning handled by frontend; backend enforces unique mobile
  const existing = await prisma.customer.findUnique({ where: { mobile: data.mobile } })
  if (existing) {
    throw createError("A customer with this mobile number already exists", 409, "DUPLICATE_MOBILE")
  }

  // Generate customer id
  const count = await prisma.customer.count()
  const year = new Date().getFullYear()
  const customerId = `CM-CUST-${year}${String(count + 1).padStart(4, "0")}`

  const customer = await prisma.customer.create({
    data: {
      customerId,
      name: data.name,
      mobile: data.mobile,
      altMobile: data.altMobile || null,
      village: data.village || null,
      district: data.district || null,
      address: data.address || null,
      notes: data.notes || null,
      openingBalance: data.openingBalance ?? 0,
    },
  })

  // Opening balance ledger entry
  if (data.openingBalance && data.openingBalance > 0) {
    await prisma.customerLedger.create({
      data: {
        customerId: customer.id,
        type: "DEBIT",
        amount: data.openingBalance,
        balanceAfter: data.openingBalance,
        reference: "OPENING",
      },
    })
  }

  await logActivity(userId, "CREATE", "Customer", customer.id, null, customer)
  return customer
}

export const updateCustomer = async (id: string, data: any, userId: number) => {
  const existing = await prisma.customer.findUnique({ where: { id } })
  if (!existing) throw createError("Customer not found", 404, "CUSTOMER_NOT_FOUND")

  // Check mobile uniqueness if changed
  if (data.mobile && data.mobile !== existing.mobile) {
    const dup = await prisma.customer.findUnique({ where: { mobile: data.mobile } })
    if (dup) throw createError("Mobile number already in use by another customer", 409, "DUPLICATE_MOBILE")
  }

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      name: data.name,
      mobile: data.mobile,
      altMobile: data.altMobile ?? null,
      village: data.village ?? null,
      district: data.district ?? null,
      address: data.address ?? null,
      notes: data.notes ?? null,
      openingBalance: data.openingBalance ?? 0,
    },
  })

  await logActivity(userId, "UPDATE", "Customer", id, existing, customer)
  return customer
}

export const archiveCustomer = async (id: string, userId: number) => {
  const customer = await prisma.customer.findUnique({ where: { id } })
  if (!customer) throw createError("Customer not found", 404, "CUSTOMER_NOT_FOUND")

  const hasPending = await prisma.order.findFirst({
    where: { customerId: id, status: { notIn: ["FULLY_DELIVERED", "CLOSED", "CANCELLED"] } },
  })
  if (hasPending) {
    throw createError("Cannot archive customer with active orders", 400, "ACTIVE_ORDERS")
  }

  const updated = await prisma.customer.update({
    where: { id },
    data: { isArchived: true },
  })
  await logActivity(userId, "ARCHIVE", "Customer", id, customer, updated)
  return updated
}

export const getCustomerLedger = async (customerId: string) => {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } })
  if (!customer) throw createError("Customer not found", 404, "CUSTOMER_NOT_FOUND")

  const ledger = await prisma.customerLedger.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    include: {
      order: { select: { orderId: true } },
      payment: { select: { paymentId: true } },
    },
  })

  let balance = Number(customer.openingBalance)
  const entries = ledger.map((e) => {
    const amount = Number(e.amount)
    balance = e.type === "DEBIT" ? balance + amount : balance - amount
    return { ...e, amount, balanceAfter: Number(e.balanceAfter) }
  })

  return { customer, entries, openingBalance: Number(customer.openingBalance) }
}

export const getCustomerStats = async (customerId: string) => {
  const orders = await prisma.order.aggregate({
    where: { customerId },
    _count: { id: true },
  })
  const completed = await prisma.order.count({ where: { customerId, status: "FULLY_DELIVERED" } })
  const pending = await prisma.order.count({ where: { customerId, status: { in: ["ORDER_RECEIVED", "WEIGHMENT_COMPLETED", "WAITING_IN_QUEUE", "PROCESSING_STARTED", "PROCESSING_COMPLETED", "QUALITY_CHECK", "READY_FOR_DELIVERY", "PARTIALLY_DELIVERED"] } } })
  const payments = await prisma.payment.aggregate({
    where: { customerId, isReversed: false },
    _sum: { amount: true },
  })
  const charges = await prisma.order.aggregate({
    where: { customerId },
    _sum: { finalAmount: true },
  })

  return {
    totalOrders: orders._count.id,
    completedOrders: completed,
    pendingOrders: pending,
    totalCharges: Number(charges._sum.finalAmount || 0),
    totalPaid: Number(payments._sum.amount || 0),
  }
}
