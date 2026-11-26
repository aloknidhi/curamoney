import { prisma } from "../config/prisma"

const parseDate = (v: string | undefined) => (v ? new Date(v) : undefined)

export const dashboardReport = async () => {
  const today = new Date(new Date().setHours(0, 0, 0, 0))
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const [totalOrders, todayOrders, byStatus, todayRevenue, monthlyRevenue, totalCustomers, outstanding, totalExpenses, dailyOrders] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { orderDate: { gte: today } } }),
    prisma.order.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.order.aggregate({ where: { orderDate: { gte: today } }, _sum: { amountPaid: true } }),
    prisma.order.aggregate({ where: { orderDate: { gte: monthStart } }, _sum: { amountPaid: true } }),
    prisma.customer.count({ where: { isArchived: false } }),
    prisma.order.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { remainingBalance: true } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.order.groupBy({
      by: ["orderDate"],
      where: { orderDate: { gte: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) } },
      _count: { id: true },
      orderBy: { orderDate: "asc" },
    }),
  ])

  return {
    totalOrders,
    todayOrders,
    pendingOrders: byStatus.find((b) => b.status === "ORDER_RECEIVED")?._count.id || 0,
    processingOrders: byStatus.filter((b) => ["PROCESSING_STARTED", "PROCESSING_COMPLETED", "QUALITY_CHECK"].includes(b.status)).reduce((a, b) => a + b._count.id, 0),
    completedOrders: byStatus.find((b) => b.status === "FULLY_DELIVERED")?._count.id || 0,
    deliveredOrders: byStatus.find((b) => b.status === "FULLY_DELIVERED")?._count.id || 0,
    totalCustomers,
    todayRevenue: Number(todayRevenue._sum.amountPaid || 0),
    monthlyRevenue: Number(monthlyRevenue._sum.amountPaid || 0),
    outstanding: Number(outstanding._sum.remainingBalance || 0),
    totalExpenses: Number(totalExpenses._sum.amount || 0),
    netOperatingProfit: Number(todayRevenue._sum.amountPaid || 0) - Number(totalExpenses._sum.amount || 0),
    dailyOrders: dailyOrders.map((d) => ({ date: d.orderDate.toISOString().split("T")[0], count: d._count.id })),
    statusDistribution: byStatus.map((b) => ({ status: b.status, count: b._count.id })),
  }
}

export const revenueReport = async (startDate?: string, endDate?: string) => {
  const where: any = {}
  if (startDate || endDate) {
    where.orderDate = {}
    if (startDate) where.orderDate.gte = parseDate(startDate)
    if (endDate) where.orderDate.lte = parseDate(endDate)
  }
  where.status = { not: "CANCELLED" }

  const [daily, monthly, total] = await Promise.all([
    prisma.order.groupBy({
      by: ["orderDate"],
      where,
      _sum: { finalAmount: true, amountPaid: true },
      orderBy: { orderDate: "asc" },
    }),
    prisma.order.aggregate({ where, _sum: { finalAmount: true, amountPaid: true } }),
    prisma.order.aggregate({ where, _sum: { finalAmount: true, amountPaid: true } }),
  ])

  return {
    daily: daily.map((d) => ({
      date: d.orderDate.toISOString().split("T")[0],
      revenue: Number(d._sum.finalAmount || 0),
      collected: Number(d._sum.amountPaid || 0),
    })),
    summary: {
      totalRevenue: Number(total._sum.finalAmount || 0),
      totalCollected: Number(total._sum.amountPaid || 0),
    },
  }
}

export const productionReport = async (startDate?: string, endDate?: string) => {
  const where: any = {}
  if (startDate || endDate) {
    where.recordedAt = {}
    if (startDate) where.recordedAt.gte = parseDate(startDate)
    if (endDate) where.recordedAt.lte = parseDate(endDate)
  }

  const records = await prisma.weighmentRecord.findMany({
    where,
    orderBy: { recordedAt: "desc" },
    include: { order: { select: { orderId: true, customer: { select: { name: true } } } } },
  })

  const totalInput = records.reduce((a, r) => a + Number(r.inputWeight), 0)
  const totalFinished = records.reduce((a, r) => a + Number(r.finishedWeight || 0), 0)
  const totalBroken = records.reduce((a, r) => a + Number(r.brokenQty), 0)
  const totalByProduct = records.reduce((a, r) => a + Number(r.byProductQty), 0)
  const totalWastage = records.reduce((a, r) => a + Number(r.wastageQty), 0)

  return {
    records: records.map((r) => ({
      orderId: r.order.orderId,
      customer: r.order.customer.name,
      batchNumber: r.batchNumber,
      inputWeight: Number(r.inputWeight),
      finishedWeight: Number(r.finishedWeight || 0),
      yieldPercent: Number(r.yieldPercent || 0),
      recordedAt: r.recordedAt,
    })),
    summary: {
      totalInput,
      totalFinished,
      totalBroken,
      totalByProduct,
      totalWastage,
      overallYield: totalInput > 0 ? Number(((totalFinished / totalInput) * 100).toFixed(2)) : 0,
    },
  }
}

export const expenseReport = async (startDate?: string, endDate?: string) => {
  const where: any = {}
  if (startDate || endDate) {
    where.expenseDate = {}
    if (startDate) where.expenseDate.gte = parseDate(startDate)
    if (endDate) where.expenseDate.lte = parseDate(endDate)
  }

  const categories = await prisma.expenseCategory.findMany({ select: { id: true, name: true } })
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))

  const [categoryWise, monthly, total] = await Promise.all([
    prisma.expense.groupBy({
      by: ["categoryId"],
      where,
      _sum: { amount: true },
    }),
    prisma.expense.groupBy({
      by: ["expenseDate"],
      where,
      _sum: { amount: true },
      orderBy: { expenseDate: "asc" },
    }),
    prisma.expense.aggregate({ where, _sum: { amount: true } }),
  ])

  return {
    categoryWise: categoryWise.map((c) => ({ category: categoryMap[c.categoryId] || c.categoryId, total: Number(c._sum.amount || 0) })),
    monthly: monthly.map((d) => ({ date: d.expenseDate.toISOString().split("T")[0], total: Number(d._sum.amount || 0) })),
    total: Number(total._sum.amount || 0),
  }
}

export const outstandingReport = async () => {
  const orders = await prisma.order.findMany({
    where: { status: { not: "CANCELLED" }, remainingBalance: { gt: 0 } },
    include: { customer: { select: { name: true, mobile: true } } },
    orderBy: { remainingBalance: "desc" },
  })
  const total = orders.reduce((a, o) => a + Number(o.remainingBalance), 0)
  return {
    total,
    count: orders.length,
    orders: orders.map((o) => ({
      orderId: o.orderId,
      customer: o.customer.name,
      mobile: o.customer.mobile,
      finalAmount: Number(o.finalAmount),
      amountPaid: Number(o.amountPaid),
      remainingBalance: Number(o.remainingBalance),
      status: o.status,
    })),
  }
}

export const customerLedgerReport = async (customerId: string) => {
  const ledger = await prisma.customerLedger.findMany({
    where: { customerId },
    orderBy: { createdAt: "asc" },
    include: { order: { select: { orderId: true } }, payment: { select: { paymentId: true } } },
  })
  let balance = 0
  const entries = ledger.map((e) => {
    const amount = Number(e.amount)
    balance = e.type === "DEBIT" ? balance + amount : balance - amount
    return { ...e, amount, balance }
  })
  return { entries, closingBalance: balance }
}
