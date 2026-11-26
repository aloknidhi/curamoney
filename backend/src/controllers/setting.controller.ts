import { Request, Response } from "express"
import * as settingService from "../services/setting.service"

export const listSettings = async (req: Request, res: Response) => {
  const category = typeof req.query.category === "string" ? req.query.category : undefined
  const data = await settingService.listSettings(category)
  res.json({ success: true, data })
}

export const upsertSetting = async (req: Request, res: Response) => {
  const data = await settingService.upsertSetting(req.body)
  res.json({ success: true, data })
}

export const bulkUpsertSettings = async (req: Request, res: Response) => {
  const data = await settingService.bulkUpsertSettings(req.body)
  res.json({ success: true, data })
}

export const getSetting = async (req: Request, res: Response) => {
  const value = await settingService.getSetting(req.params.key)
  res.json({ success: true, data: { key: req.params.key, value } })
}
