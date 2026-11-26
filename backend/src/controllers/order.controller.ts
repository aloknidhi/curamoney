import { Request, Response } from "express"
import * as orderService from "../services/order.service"

export const listOrders = async (req: Request, res: Response) => {
  const result = await orderService.listOrders(req.query)
  res.json({ success: true, data: result })
}

export const getOrder = async (req: Request, res: Response) => {
  const data = await orderService.getOrder(req.params.id)
  res.json({ success: true, data })
}

export const createOrder = async (req: Request, res: Response) => {
  const data = await orderService.createOrder(req.body, req.user!.id)
  res.status(201).json({ success: true, data })
}

export const updateOrder = async (req: Request, res: Response) => {
  const data = await orderService.updateOrder(req.params.id, req.body, req.user!.id)
  res.json({ success: true, data })
}

export const updateOrderStatus = async (req: Request, res: Response) => {
  const { newStatus, remarks } = req.body
  const data = await orderService.updateOrderStatus(req.params.id, newStatus, remarks, req.user!.id)
  res.json({ success: true, data })
}

export const cancelOrder = async (req: Request, res: Response) => {
  const { reason } = req.body
  const data = await orderService.cancelOrder(req.params.id, reason, req.user!.id)
  res.json({ success: true, data })
}

export const deleteOrder = async (req: Request, res: Response) => {
  await orderService.deleteOrder(req.params.id, req.user!.id)
  res.json({ success: true })
}

export const getDashboardStats = async (req: Request, res: Response) => {
  const data = await orderService.getDashboardStats()
  res.json({ success: true, data })
}

export const recentOrders = async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 10
  const data = await orderService.recentOrders(limit)
  res.json({ success: true, data })
}

export const exportOrdersCsv = async (req: Request, res: Response) => {
  const csv = await orderService.exportOrdersCsv()
  res.setHeader("Content-Type", "text/csv")
  res.setHeader("Content-Disposition", "attachment; filename=orders.csv")
  res.send(csv)
}
