import { Request, Response } from "express"
import * as processingService from "../services/processing.service"

export const listProcessing = async (req: Request, res: Response) => {
  const result = await processingService.listProcessing(req.query)
  res.json({ success: true, data: result })
}

export const createWeighment = async (req: Request, res: Response) => {
  const data = await processingService.createWeighment(req.body, req.user!.id)
  res.status(201).json({ success: true, data })
}

export const listWeighments = async (req: Request, res: Response) => {
  const data = await processingService.listWeighments(req.params.orderId)
  res.json({ success: true, data })
}

export const createOrUpdateProduction = async (req: Request, res: Response) => {
  const data = await processingService.createOrUpdateProduction(req.body, req.user!.id)
  res.json({ success: true, data })
}

export const getProduction = async (req: Request, res: Response) => {
  const data = await processingService.getProduction(req.params.orderId)
  res.json({ success: true, data })
}
