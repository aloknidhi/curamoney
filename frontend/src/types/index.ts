export interface User {
  id: string
  email: string
  name: string
  role: string
  roleId: number
}

export interface Customer {
  id: string
  customerId: string
  name: string
  mobile: string
  altMobile?: string | null
  village?: string | null
  district?: string | null
  address?: string | null
  notes?: string | null
  openingBalance: string
  isArchived: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    orders: number
    payments: number
  }
}

export interface Order {
  id: string
  orderId: string
  customerId: string
  customer?: Customer
  orderDate: string
  quantity: number
  weightUnit: string
  processingCharges: string
  additionalCharges: string
  discount: string
  finalAmount: string
  amountPaid: string
  remainingBalance: string
  status: string
  expectedCompletion?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateOrderInput {
  customerId: string
  orderDate: string
  quantity: number
  weightUnit: "KG" | "QUINTAL" | "TONNE"
  processingCharges: string
  additionalCharges: string
  discount: string
  expectedCompletionDate?: string
}

export interface ProcessingRecord {
  id: string
  orderId: string
  order?: Order
  processingStart?: string | null
  processingEnd?: string | null
  operatorName?: string | null
  machineInfo?: string | null
  qualityRemarks?: string | null
  productionNotes?: string | null
  createdById?: string | null
  createdAt: string
  updatedAt: string
}

export interface WeighmentRecord {
  id: string
  orderId: string
  order?: Order
  grossWeight: string
  tareWeight: string
  netWeight: string
  moisturePercentage: string
  deductedWeight: string
  unit: string
  recordedAt: string
  createdById?: string | null
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: string
  paymentId: string
  customerId: string
  orderId?: string | null
  customer?: Customer
  order?: Order
  amount: string
  type: "DEBIT" | "CREDIT"
  paymentMethod: string
  reference?: string | null
  notes?: string | null
  paymentDate: string
  createdById?: string | null
  balanceBefore: string
  balanceAfter: string
  createdAt: string
  updatedAt: string
}

export interface CreatePaymentInput {
  customerId: string
  orderId?: string
  amount: string
  type: "DEBIT" | "CREDIT"
  paymentMethod: string
  reference?: string
  notes?: string
  paymentDate: string
}

export interface Delivery {
  id: string
  deliveryId: string
  orderId: string
  order?: Order
  deliveredQuantity: number
  deliveredWeight: string
  deliveryDate: string
  deliveryNotes?: string | null
  receivedBy?: string | null
  createdById?: string | null
  createdAt: string
  updatedAt: string
}

export interface ExpenseCategory {
  id: string
  name: string
  description?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Expense {
  id: string
  categoryId: string
  category?: ExpenseCategory
  amount: string
  expenseDate: string
  description?: string | null
  reference?: string | null
  receiptUrl?: string | null
  createdById?: string | null
  createdAt: string
  updatedAt: string
}

export interface BusinessSetting {
  id: string
  key: string
  value: string
  category: string
  description?: string | null
  dataType: string
  isEditable: boolean
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  totalOrders: number
  todayOrders: number
  pendingOrders: number
  processingOrders: number
  completedOrders: number
  deliveredOrders: number
  totalCustomers: number
  todayRevenue: number
  monthlyRevenue: number
  outstanding: number
  totalExpenses: number
  netOperatingProfit: number
  dailyOrders: Array<{ date: string; count: number }>
  statusDistribution: Array<{ status: string; count: number }>
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  token: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  roleId: number
}

export interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}
