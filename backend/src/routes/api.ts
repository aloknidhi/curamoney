import { Router } from "express"
import { authenticate, authorize } from "../middleware/auth"
import { validate } from "../middleware/validate"
import * as authController from "../controllers/auth.controller"
import * as otpController from "../controllers/otp.controller"
import * as customerController from "../controllers/customer.controller"
import * as orderController from "../controllers/order.controller"
import * as processingController from "../controllers/processing.controller"
import * as paymentController from "../controllers/payment.controller"
import * as deliveryController from "../controllers/delivery.controller"
import * as expenseController from "../controllers/expense.controller"
import * as reportController from "../controllers/report.controller"
import * as settingController from "../controllers/setting.controller"
import * as authValidators from "../validators/auth"
import * as otpValidators from "../validators/otp"
import * as customerValidators from "../validators/customers"
import * as orderValidators from "../validators/orders"
import * as processingValidators from "../validators/processing"
import * as paymentValidators from "../validators/payments"
import * as deliveryValidators from "../validators/deliveries"
import * as expenseValidators from "../validators/expenses"
import * as settingValidators from "../validators/settings"

const router = Router()

// Health check
router.get("/health", (_req, res) => res.json({ status: "ok", service: "curamoney-backend" }))

// Auth
router.post("/auth/login", validate(authValidators.loginSchema, "body"), authController.login)
router.post("/auth/logout", authController.logout)
router.get("/auth/me", authenticate, authController.me)
router.post("/auth/register", validate(authValidators.registerSchema, "body"), authController.register)
router.post("/auth/forgot-password", validate(authValidators.forgotPasswordSchema, "body"), authController.forgotPassword)
router.post("/auth/reset-password", validate(authValidators.resetPasswordSchema, "body"), authController.resetPassword)
router.post("/auth/change-password", authenticate, validate(authValidators.changePasswordSchema, "body"), authController.changePassword)

// OTP
router.post("/auth/send-otp", validate(otpValidators.sendOtpSchema, "body"), otpController.sendOtp)
router.post("/auth/verify-otp", validate(otpValidators.verifyOtpSchema, "body"), otpController.verifyOtp)
router.post("/auth/signup", validate(otpValidators.signupSchema, "body"), otpController.signup)
router.post("/auth/forgot-password-otp", validate(otpValidators.forgotPasswordSchema, "body"), otpController.forgotPassword)
router.post("/auth/reset-password-otp", validate(otpValidators.resetPasswordSchema, "body"), otpController.resetPassword)

// Customers
router.get("/customers", authenticate, customerController.listCustomers)
router.post("/customers", authenticate, validate(customerValidators.customerCreateSchema, "body"), customerController.createCustomer)
router.get("/customers/:id", authenticate, customerController.getCustomer)
router.put("/customers/:id", authenticate, validate(customerValidators.customerUpdateSchema, "body"), customerController.updateCustomer)
router.delete("/customers/:id", authenticate, authorize("OWNER"), customerController.archiveCustomer)
router.get("/customers/:customerId/ledger", authenticate, customerController.getCustomerLedger)
router.get("/customers/:id/stats", authenticate, customerController.getCustomerStats)

// Orders
router.get("/orders", authenticate, orderController.listOrders)
router.post("/orders", authenticate, validate(orderValidators.orderCreateSchema, "body"), orderController.createOrder)
router.get("/orders/:id", authenticate, orderController.getOrder)
router.put("/orders/:id", authenticate, validate(orderValidators.orderUpdateSchema, "body"), orderController.updateOrder)
router.patch("/orders/:id/status", authenticate, validate(orderValidators.orderStatusUpdateSchema, "body"), orderController.updateOrderStatus)
router.post("/orders/:id/cancel", authenticate, validate(orderValidators.orderCancelSchema, "body"), orderController.cancelOrder)
router.delete("/orders/:id", authenticate, authorize("OWNER"), orderController.deleteOrder)
router.get("/orders/dashboard/stats", authenticate, orderController.getDashboardStats)
router.get("/orders/recent", authenticate, orderController.recentOrders)
router.get("/orders/export/csv", authenticate, orderController.exportOrdersCsv)

// Processing
router.get("/processing", authenticate, processingController.listProcessing)
router.post("/orders/:orderId/weighments", authenticate, validate(processingValidators.weighmentCreateSchema, "body"), processingController.createWeighment)
router.get("/orders/:orderId/weighments", authenticate, processingController.listWeighments)
router.post("/orders/:orderId/production", authenticate, validate(processingValidators.productionRecordSchema, "body"), processingController.createOrUpdateProduction)
router.get("/orders/:orderId/production", authenticate, processingController.getProduction)

// Payments
router.get("/payments", authenticate, paymentController.listPayments)
router.post("/payments", authenticate, validate(paymentValidators.paymentCreateSchema, "body"), paymentController.createPayment)
router.get("/payments/:id", authenticate, paymentController.getPayment)
router.post("/payments/:id/reverse", authenticate, authorize("OWNER", "ACCOUNTANT"), validate(paymentValidators.paymentReverseSchema, "body"), paymentController.reversePayment)
router.get("/payments/daily", authenticate, paymentController.getDailyCollections)
router.get("/payments/monthly", authenticate, paymentController.getMonthlyCollections)

// Deliveries
router.post("/orders/:orderId/deliveries", authenticate, validate(deliveryValidators.deliveryCreateSchema, "body"), deliveryController.createDelivery)
router.get("/deliveries", authenticate, deliveryController.listDeliveries)
router.get("/deliveries/:id", authenticate, deliveryController.getDelivery)

// Expenses
router.get("/expenses/categories", authenticate, expenseController.listCategories)
router.post("/expenses/categories", authenticate, authorize("OWNER"), validate(expenseValidators.expenseCategorySchema, "body"), expenseController.createCategory)
router.get("/expenses", authenticate, expenseController.listExpenses)
router.post("/expenses", authenticate, validate(expenseValidators.expenseCreateSchema, "body"), expenseController.createExpense)
router.put("/expenses/:id", authenticate, validate(expenseValidators.expenseUpdateSchema, "body"), expenseController.updateExpense)
router.get("/expenses/summary", authenticate, expenseController.expenseSummary)

// Reports
router.get("/reports/dashboard", authenticate, reportController.dashboardReport)
router.get("/reports/revenue", authenticate, reportController.revenueReport)
router.get("/reports/production", authenticate, reportController.productionReport)
router.get("/reports/expenses", authenticate, reportController.expenseReport)
router.get("/reports/outstanding", authenticate, reportController.outstandingReport)
router.get("/reports/customers/:customerId/ledger", authenticate, reportController.customerLedgerReport)

// Settings
router.get("/settings", authenticate, settingController.listSettings)
router.get("/settings/:key", authenticate, settingController.getSetting)
router.put("/settings", authenticate, authorize("OWNER"), validate(settingValidators.settingUpsertSchema, "body"), settingController.upsertSetting)
router.put("/settings/bulk", authenticate, authorize("OWNER"), settingController.bulkUpsertSettings)

export default router
