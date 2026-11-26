import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { AuthProvider } from "@/contexts/AuthContext"
import { Toaster } from "sonner"
import LoginPage from "@/pages/LoginPage"
import DashboardLayout from "@/components/layout/DashboardLayout"
import DashboardPage from "@/pages/DashboardPage"
import CustomersPage from "@/pages/CustomersPage"
import OrdersPage from "@/pages/OrdersPage"
import ProcessingPage from "@/pages/ProcessingPage"
import PaymentsPage from "@/pages/PaymentsPage"
import DeliveriesPage from "@/pages/DeliveriesPage"
import ExpensesPage from "@/pages/ExpensesPage"
import ReportsPage from "@/pages/ReportsPage"
import SettingsPage from "@/pages/SettingsPage"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
})

function RequireAuth({ children }: { children: any }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
        <Toaster />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <DashboardLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="processing" element={<ProcessingPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="deliveries" element={<DeliveriesPage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
