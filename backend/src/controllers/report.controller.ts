import { Request, Response } from "express"
import * as reportService from "../services/report.service"

export const dashboardReport = async (_req: Request, res: Response) => {
  const data = await reportService.dashboardReport()
  res.json({ success: true, data })
}

export const revenueReport = async (req: Request, res: Response) => {
  const startDate = typeof req.query.startDate === "string" ? req.query.startDate : undefined
  const endDate = typeof req.query.endDate === "string" ? req.query.endDate : undefined
  const data = await reportService.revenueReport(startDate, endDate)
  res.json({ success: true, data })
}

export const productionReport = async (req: Request, res: Response) => {
  const startDate = typeof req.query.startDate === "string" ? req.query.startDate : undefined
  const endDate = typeof req.query.endDate === "string" ? req.query.endDate : undefined
  const data = await reportService.productionReport(startDate, endDate)
  res.json({ success: true, data })
}

export const expenseReport = async (req: Request, res: Response) => {
  const startDate = typeof req.query.startDate === "string" ? req.query.startDate : undefined
  const endDate = typeof req.query.endDate === "string" ? req.query.endDate : undefined
  const data = await reportService.expenseReport(startDate, endDate)
  res.json({ success: true, data })
}

export const outstandingReport = async (_req: Request, res: Response) => {
  const data = await reportService.outstandingReport()
  res.json({ success: true, data })
}

export const customerLedgerReport = async (req: Request, res: Response) => {
  const data = await reportService.customerLedgerReport(req.params.customerId)
  res.json({ success: true, data })
}
