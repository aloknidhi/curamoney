"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { customerApi, orderApi, processingApi, paymentApi, deliveryApi, expenseApi, settingApi, reportApi } from "@/services/apis"
import type { Customer, CreateOrderInput, CreatePaymentInput } from "@/types"

// Customer hooks
export function useCustomers(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => customerApi.list(params).then((r) => r.data),
  })
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: () => customerApi.get(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Customer>) => customerApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) => customerApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
    },
  })
}

// Order hooks
export function useOrders(params?: { page?: number; limit?: number; status?: string; customerId?: string }) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => orderApi.list(params).then((r) => r.data),
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: () => orderApi.get(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateOrderInput) => orderApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
    },
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => orderApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
    },
  })
}

// Processing hooks
export function useProcessing(params?: { orderId?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["processing", params],
    queryFn: () => processingApi.list(params).then((r) => r.data),
  })
}

export function useCreateWeighment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { orderId: string; grossWeight: string; tareWeight: string; unit: string; moisturePercentage?: string }) =>
      processingApi.createWeighment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processing"] })
    },
  })
}

export function useCreateProduction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { orderId: string; processingStart?: string; processingEnd?: string; operatorName?: string; machineInfo?: string; qualityRemarks?: string; productionNotes?: string }) =>
      processingApi.createOrUpdateProduction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processing"] })
    },
  })
}

// Payment hooks
export function usePayments(params?: { page?: number; limit?: number; customerId?: string; type?: string }) {
  return useQuery({
    queryKey: ["payments", params],
    queryFn: () => paymentApi.list(params).then((r) => r.data),
  })
}

export function useCreatePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePaymentInput) => paymentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] })
    },
  })
}

// Delivery hooks
export function useDeliveries(params?: { page?: number; limit?: number; orderId?: string }) {
  return useQuery({
    queryKey: ["deliveries", params],
    queryFn: () => deliveryApi.list(params).then((r) => r.data),
  })
}

export function useCreateDelivery() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { orderId: string; deliveredQuantity: number; deliveredWeight: string; deliveryDate: string; deliveryNotes?: string; receivedBy?: string }) =>
      deliveryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] })
    },
  })
}

// Expense hooks
export function useExpenseCategories() {
  return useQuery({
    queryKey: ["expenseCategories"],
    queryFn: () => expenseApi.listCategories().then((r) => r.data),
  })
}

export function useExpenses(params?: { page?: number; limit?: number; categoryId?: string; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ["expenses", params],
    queryFn: () => expenseApi.list(params).then((r) => r.data),
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { categoryId: string; amount: string; expenseDate: string; description?: string; reference?: string }) =>
      expenseApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] })
    },
  })
}

// Setting hooks
export function useSettings(params?: { category?: string }) {
  return useQuery({
    queryKey: ["settings", params],
    queryFn: () => settingApi.list(params).then((r) => r.data),
  })
}

export function useUpsertSetting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { key: string; value: string; category: string; description?: string; dataType?: string }) =>
      settingApi.upsert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] })
    },
  })
}

// Report hooks
export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => reportApi.dashboard().then((r) => r.data),
  })
}

export function useRevenueReport(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ["revenueReport", params],
    queryFn: () => reportApi.revenue(params).then((r) => r.data),
  })
}

export function useProductionReport(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ["productionReport", params],
    queryFn: () => reportApi.production(params).then((r) => r.data),
  })
}

export function useExpenseReport(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ["expenseReport", params],
    queryFn: () => reportApi.expense(params).then((r) => r.data),
  })
}

// Auth hooks
export function useLogin() {
  const { login } = useAuth();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
  });
}
