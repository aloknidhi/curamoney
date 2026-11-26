import { Request, Response } from "express"
import * as customerService from "../services/customer.service"

export const listCustomers = async (req: Request, res: Response) => {
  const result = await customerService.listCustomers(req.query, req.user!.id)
  res.json({ success: true, data: result })
}

export const getCustomer = async (req: Request, res: Response) => {
  const data = await customerService.getCustomer(req.params.id)
  res.json({ success: true, data })
}

export const createCustomer = async (req: Request, res: Response) => {
  const data = await customerService.createCustomer(req.body, req.user!.id)
  res.status(201).json({ success: true, data })
}

export const updateCustomer = async (req: Request, res: Response) => {
  const data = await customerService.updateCustomer(req.params.id, req.body, req.user!.id)
  res.json({ success: true, data })
}

export const archiveCustomer = async (req: Request, res: Response) => {
  const data = await customerService.archiveCustomer(req.params.id, req.user!.id)
  res.json({ success: true, data })
}

export const getCustomerLedger = async (req: Request, res: Response) => {
  const data = await customerService.getCustomerLedger(req.params.customerId)
  res.json({ success: true, data })
}

export const getCustomerStats = async (req: Request, res: Response) => {
  const data = await customerService.getCustomerStats(req.params.id)
  res.json({ success: true, data })
}
