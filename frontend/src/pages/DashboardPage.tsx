"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDashboardStats } from "@/hooks/useApi"
import { cn } from "@/lib/utils"
import {
  ShoppingCart,
  Users,
  CreditCard,
  Truck,
  Clock,
  Package,
  TrendingUp,
  DollarSign,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const statCards = [
  { title: "Total Orders", key: "totalOrders", value: "0", icon: ShoppingCart, color: "text-primary" },
  { title: "Pending Orders", key: "pendingOrders", value: "0", icon: Clock, color: "text-orange-500" },
  { title: "Processing", key: "processingOrders", value: "0", icon: Package, color: "text-blue-500" },
  { title: "Delivered", key: "deliveredOrders", value: "0", icon: Truck, color: "text-green-500" },
  { title: "Total Customers", key: "totalCustomers", value: "0", icon: Users, color: "text-indigo-500" },
  { title: "Today Revenue", key: "todayRevenue", value: "₹0", icon: DollarSign, color: "text-emerald-500" },
  { title: "Monthly Revenue", key: "monthlyRevenue", value: "₹0", icon: TrendingUp, color: "text-emerald-500" },
  { title: "Outstanding", key: "outstanding", value: "₹0", icon: CreditCard, color: "text-red-500" },
]

export default function DashboardPage() {
  const { data, isLoading } = useDashboardStats()
  const stats = data?.data

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your mill operations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          const value = isLoading ? "--" : (stats as any)?.[stat.key] ?? stat.value
          return (
            <Card key={stat.title} className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={cn(stat.color, "h-4 w-4")} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button variant="outline" className="w-full">
              New Order
            </Button>
            <Button variant="outline" className="w-full">
              Register Customer
            </Button>
            <Button variant="outline" className="w-full">
              Record Payment
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground text-sm">No recent activity yet. Start by creating a customer or order.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
