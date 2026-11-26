import { api, PaginatedResponse } from "@/services/api"
import type { Customer, Order, ProcessingRecord, WeighmentRecord, Payment, Delivery, ExpenseCategory, Expense, BusinessSetting, DashboardStats, CreateOrderInput,   CreatePaymentInput,
  LoginResponse,
} from "@/types"

// Customers
export const customerApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<PaginatedResponse<Customer>>("/customers", { params }),
  get: (id: string) => api.get<{ data: Customer }>(`/customers/${id}`),
  create: (data: Partial<Customer>) => api.post<{ data: Customer }>("/customers", data),
  update: (id: string, data: Partial<Customer>) => api.patch<{ data: Customer }>(`/customers/${id}`, data),
  archive: (id: string) => api.delete<{ data: Customer }>(`/customers/${id}`),
}

// Orders
export const orderApi = {
  list: (params?: { page?: number; limit?: number; status?: string; customerId?: string }) =>
    api.get<PaginatedResponse<Order>>("/orders", { params }),
  get: (id: string) => api.get<{ data: Order }>(`/orders/${id}`),
  create: (data: CreateOrderInput) => api.post<{ data: Order }>("/orders", data),
  update: (id: string, data: Partial<Order>) => api.patch<{ data: Order }>(`/orders/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch<{ data: Order }>(`/orders/${id}/status`, { status }),
  cancel: (id: string) => api.delete<{ data: Order }>(`/orders/${id}`),
}

// Processing
export const processingApi = {
  list: (params?: { orderId?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<ProcessingRecord>>("/processing", { params }),
  createWeighment: (data: { orderId: string; grossWeight: string; tareWeight: string; unit: string; moisturePercentage?: string }) =>
    api.post<{ data: WeighmentRecord }>("/processing/weighments", data),
  listWeighments: (params?: { orderId?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<WeighmentRecord>>("/processing/weighments", { params }),
  createOrUpdateProduction: (data: { orderId: string; processingStart?: string; processingEnd?: string; operatorName?: string; machineInfo?: string; qualityRemarks?: string; productionNotes?: string }) =>
    api.post<{ data: ProcessingRecord }>("/processing/production", data),
  getProduction: (orderId: string) => api.get<{ data: ProcessingRecord }>(`/processing/production/${orderId}`),
}

// Payments
export const paymentApi = {
  list: (params?: { page?: number; limit?: number; customerId?: string; type?: string }) =>
    api.get<PaginatedResponse<Payment>>("/payments", { params }),
  create: (data: CreatePaymentInput) => api.post<{ data: Payment }>("/payments", data),
  get: (id: string) => api.get<{ data: Payment }>(`/payments/${id}`),
  reverse: (id: string) => api.post<{ data: Payment }>(`/payments/${id}/reverse`),
  dailyCollections: (date?: string) => api.get<{ data: any }>("/payments/daily-collections", { params: { date } }),
  monthlyCollections: (month?: string) => api.get<{ data: any }>("/payments/monthly-collections", { params: { month } }),
}

// Deliveries
export const deliveryApi = {
  list: (params?: { page?: number; limit?: number; orderId?: string }) =>
    api.get<PaginatedResponse<Delivery>>("/deliveries", { params }),
  create: (data: { orderId: string; deliveredQuantity: number; deliveredWeight: string; deliveryDate: string; deliveryNotes?: string; receivedBy?: string }) =>
    api.post<{ data: Delivery }>("/deliveries", data),
  get: (id: string) => api.get<{ data: Delivery }>(`/deliveries/${id}`),
}

// Expenses
export const expenseApi = {
  listCategories: () => api.get<{ data: ExpenseCategory[] }>("/expenses/categories"),
  createCategory: (data: { name: string; description?: string }) => api.post<{ data: ExpenseCategory }>("/expenses/categories", data),
  list: (params?: { page?: number; limit?: number; categoryId?: string; startDate?: string; endDate?: string }) =>
    api.get<PaginatedResponse<Expense>>("/expenses", { params }),
  create: (data: { categoryId: string; amount: string; expenseDate: string; description?: string; reference?: string }) =>
    api.post<{ data: Expense }>("/expenses", data),
  update: (id: string, data: { amount?: string; expenseDate?: string; description?: string; reference?: string }) =>
    api.patch<{ data: Expense }>(`/expenses/${id}`, data),
  summary: (startDate?: string, endDate?: string) =>
    api.get<{ data: any }>("/expenses/summary", { params: { startDate, endDate } }),
}

// Settings
export const settingApi = {
  list: (params?: { category?: string }) => api.get<{ data: BusinessSetting[] }>("/settings", { params }),
  upsert: (data: { key: string; value: string; category: string; description?: string; dataType?: string }) =>
    api.post<{ data: BusinessSetting }>("/settings", data),
  bulkUpsert: (data: Array<{ key: string; value: string; category: string }>) =>
    api.post<{ data: BusinessSetting[] }>("/settings/bulk", data),
}

// Reports
export const reportApi = {
  dashboard: () => api.get<{ data: DashboardStats }>("/reports/dashboard"),
  revenue: (params?: { startDate?: string; endDate?: string }) =>
    api.get<{ data: any }>("/reports/revenue", { params }),
  production: (params?: { startDate?: string; endDate?: string }) =>
    api.get<{ data: any }>("/reports/production", { params }),
  expense: (params?: { startDate?: string; endDate?: string }) =>
    api.get<{ data: any }>("/reports/expense", { params }),
  outstanding: () => api.get<{ data: any }>("/reports/outstanding"),
  customerLedger: (customerId: string) => api.get<{ data: any }>(`/reports/customer-ledger/${customerId}`),
}

// Auth
export const authApi = {
  login: (data: { email: string; password: string }) => api.post<{ data: LoginResponse }>("/auth/login", data),
  me: () => api.get<{ data: { user: any } }>("/auth/me"),
  logout: () => api.post("/auth/logout"),
}
