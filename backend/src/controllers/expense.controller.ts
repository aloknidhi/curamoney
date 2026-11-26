import { Request, Response } from "express"
import * as expenseService from "../services/expense.service"

export const listCategories = async (_req: Request, res: Response) => {
  const data = await expenseService.listExpenseCategories()
  res.json({ success: true, data })
}

export const createCategory = async (req: Request, res: Response) => {
  const data = await expenseService.createExpenseCategory(req.body, req.user!.id)
  res.status(201).json({ success: true, data })
}

export const listExpenses = async (req: Request, res: Response) => {
  const result = await expenseService.listExpenses(req.query)
  res.json({ success: true, data: result })
}

export const createExpense = async (req: Request, res: Response) => {
  const data = await expenseService.createExpense(req.body, req.user!.id)
  res.status(201).json({ success: true, data })
}

export const updateExpense = async (req: Request, res: Response) => {
  const data = await expenseService.updateExpense(req.params.id, req.body, req.user!.id)
  res.json({ success: true, data })
}

export const expenseSummary = async (req: Request, res: Response) => {
  const startDate = typeof req.query.startDate === "string" ? req.query.startDate : undefined
  const endDate = typeof req.query.endDate === "string" ? req.query.endDate : undefined
  const data = await expenseService.expenseSummary(startDate, endDate)
  res.json({ success: true, data })
}
