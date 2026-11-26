import { Request, Response } from "express"
import * as paymentService from "../services/payment.service"

export const listPayments = async (req: Request, res: Response) => {
  const result = await paymentService.listPayments(req.query)
  res.json({ success: true, data: result })
}

export const createPayment = async (req: Request, res: Response) => {
  const data = await paymentService.createPayment(req.body, req.user!.id)
  res.status(201).json({ success: true, data })
}

export const getPayment = async (req: Request, res: Response) => {
  const data = await paymentService.getPayment(req.params.id)
  res.json({ success: true, data })
}

export const reversePayment = async (req: Request, res: Response) => {
  const { reason } = req.body
  const data = await paymentService.reversePayment(req.params.id, reason, req.user!.id)
  res.json({ success: true, data })
}

export const getDailyCollections = async (req: Request, res: Response) => {
  const data = await paymentService.getDailyCollections()
  res.json({ success: true, data })
}

export const getMonthlyCollections = async (req: Request, res: Response) => {
  const data = await paymentService.getMonthlyCollections()
  res.json({ success: true, data })
}
