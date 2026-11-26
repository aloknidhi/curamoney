import { prisma } from "../config/prisma"
import { createError } from "../middleware/error"
import { logActivity } from "./auth.service"

const generateExpenseId = async (): Promise<string> => {
  const count = await prisma.expense.count()
  const year = new Date().getFullYear()
  return `CM-EXP-${year}${String(count + 1).padStart(4, "0")}`
}

export const listExpenseCategories = async () => {
  return prisma.expenseCategory.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
}

export const createExpenseCategory = async (data: any, userId: number) => {
  const cat = await prisma.expenseCategory.create({ data: { name: data.name } })
  await logActivity(userId, "CREATE", "ExpenseCategory", cat.id, null, cat)
  return cat
}

export const listExpenses = async (query: any) => {
  const { categoryId, startDate, endDate, page = 1, limit = 20 } = query
  const skip = (page - 1) * limit
  const where: any = {}
  if (categoryId) where.categoryId = categoryId
  if (startDate || endDate) {
    where.expenseDate = {}
    if (startDate) where.expenseDate.gte = new Date(startDate)
    if (endDate) where.expenseDate.lte = new Date(endDate)
  }

  const [expenses, total] = await prisma.$transaction([
    prisma.expense.findMany({
      where,
      skip,
      take: limit,
      orderBy: { expenseDate: "desc" },
      include: { category: true, recordedBy: { select: { name: true } } },
    }),
    prisma.expense.count({ where }),
  ])

  return { data: expenses, meta: { total, page, limit, pages: Math.ceil(total / limit) } }
}

export const createExpense = async (data: any, userId: number) => {
  const category = await prisma.expenseCategory.findUnique({ where: { id: data.categoryId } })
  if (!category) throw createError("Category not found", 404, "CATEGORY_NOT_FOUND")

  const expenseId = await generateExpenseId()
  const expense = await prisma.expense.create({
    data: {
      expenseId,
      categoryId: data.categoryId,
      description: data.description,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
      recordedById: userId,
      receiptUrl: data.receiptUrl || null,
    },
    include: { category: true, recordedBy: { select: { name: true } } },
  })
  await logActivity(userId, "CREATE", "Expense", expense.id, null, expense)
  return expense
}

export const updateExpense = async (id: string, data: any, userId: number) => {
  const existing = await prisma.expense.findUnique({ where: { id } })
  if (!existing) throw createError("Expense not found", 404, "EXPENSE_NOT_FOUND")
  const expense = await prisma.expense.update({ where: { id }, data })
  await logActivity(userId, "UPDATE", "Expense", id, existing, expense)
  return expense
}

export const expenseSummary = async (startDate?: string, endDate?: string) => {
  const where: any = {}
  if (startDate || endDate) {
    where.expenseDate = {}
    if (startDate) where.expenseDate.gte = new Date(startDate)
    if (endDate) where.expenseDate.lte = new Date(endDate)
  }

  const categories = await prisma.expenseCategory.findMany({ select: { id: true, name: true } })
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))

  const [daily, monthly, categoryWise, total] = await Promise.all([
    prisma.expense.groupBy({
      by: ["expenseDate"],
      where,
      _sum: { amount: true },
      orderBy: { expenseDate: "asc" },
    }),
    prisma.expense.aggregate({ where, _sum: { amount: true } }),
    prisma.expense.groupBy({
      by: ["categoryId"],
      where,
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({ where, _sum: { amount: true } }),
  ])

  return {
    daily: daily.map((d) => ({ date: d.expenseDate.toISOString().split("T")[0], total: Number(d._sum.amount || 0) })),
    monthly: { total: Number(monthly._sum.amount || 0) },
    categoryWise: categoryWise.map((c) => ({
      category: categoryMap[c.categoryId] || c.categoryId,
      total: Number(c._sum.amount || 0),
    })),
    total: Number(total._sum.amount || 0),
  }
}
