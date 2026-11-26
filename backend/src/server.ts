import "dotenv/config"
import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import cookieParser from "cookie-parser"
import { errorHandler, createError } from "./middleware/error"
import api from "./routes/api"
import { prisma } from "./config/prisma"
import { logger } from "./config/logger"

const app = express()
const PORT = process.env.PORT || 8000

// Trust proxy (for Render/load balancer)
app.set("trust proxy", 1)

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}))
app.use(express.json({ limit: "1mb" }))
app.use(cookieParser())

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many requests" } },
}))

// Routes
app.use("/api", api)

// 404 handler
app.use((_req, _res, next) => {
  next(createError("Not found", 404, "NOT_FOUND"))
})

// Error handler
app.use(errorHandler)

const start = async () => {
  try {
    // Verify DB connectivity
    await prisma.$connect()
    logger.info("Database connected")

    app.listen(PORT, () => {
      logger.info(`CuraMoney backend running on port ${PORT}`)
    })
  } catch (err) {
    logger.error("Failed to start server", err)
    process.exit(1)
  }
}

start()

// Graceful shutdown
process.on("SIGTERM", async () => {
  await prisma.$disconnect()
  process.exit(0)
})
process.on("SIGINT", async () => {
  await prisma.$disconnect()
  process.exit(0)
})
