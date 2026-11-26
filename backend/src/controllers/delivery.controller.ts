import { Request, Response } from "express"
import * as deliveryService from "../services/delivery.service"

export const createDelivery = async (req: Request, res: Response) => {
  const data = await deliveryService.createDelivery(req.body, req.user!.id)
  res.status(201).json({ success: true, data })
}

export const listDeliveries = async (req: Request, res: Response) => {
  const result = await deliveryService.listDeliveries(req.query)
  res.json({ success: true, data: result })
}

export const getDelivery = async (req: Request, res: Response) => {
  const data = await deliveryService.getDelivery(req.params.id)
  res.json({ success: true, data })
}
