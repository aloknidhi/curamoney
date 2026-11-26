"use client"

import { useDashboardStats } from "@/hooks/useApi"
import type { DashboardStats } from "@/types"

export default function ReportsPage() {
  const { data } = useDashboardStats()
  const stats = (data?.data || {}) as DashboardStats

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Business analytics and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Orders" value={stats.totalOrders || 0} subtitle="+12% from last month" color="bg-blue-500" />
        <StatCard title="Total Revenue" value={formatMoney(stats.todayRevenue || 0)} subtitle="+8% from last month" color="bg-green-500" />
        <StatCard title="Outstanding" value={formatMoney(stats.outstanding || 0)} subtitle="Pending collections" color="bg-yellow-500" />
        <StatCard title="Customers" value={stats.totalCustomers || 0} subtitle="Active customers" color="bg-purple-500" />
      </div>

      <div className="rounded-xl border p-6">
        <h2 className="text-sm font-semibold mb-4">Revenue Overview</h2>
        <div className="h-64 flex items-end gap-2">
          {[30, 45, 25, 60, 40, 55, 35].map((v, i) => (
            <div key={i} className="flex-1 bg-neutral-200 rounded-t" style={{ height: `${v}%` }} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Last 7 days revenue trend (illustrative)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border p-6">
          <h2 className="text-sm font-semibold mb-4">Top Customers</h2>
          <ul className="space-y-3">
            {[1, 2, 3].map((i) => (
              <li key={i} className="flex justify-between">
                <span className="text-sm">Customer {i}</span>
                <span className="text-sm font-medium">₹0</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border p-6">
          <h2 className="text-sm font-semibold mb-4">Status Breakdown</h2>
          <ul className="space-y-3">
            <li className="flex justify-between">
              <span className="text-sm">Pending Orders</span>
              <span className="text-sm font-medium">{stats.pendingOrders || 0}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-sm">Processing Orders</span>
              <span className="text-sm font-medium">{stats.processingOrders || 0}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-sm">Delivered Orders</span>
              <span className="text-sm font-medium">{stats.deliveredOrders || 0}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle, color }: { title: string; value: React.ReactNode; subtitle: string; color: string }) {
  return (
    <div className={`rounded-lg p-6 ${color}`}>
      <h3 className="text-sm font-medium text-white/80">{title}</h3>
      <div className="text-2xl font-bold text-white">{value}</div>
      <p className="text-xs text-white/70 mt-1">{subtitle}</p>
    </div>
  )
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)
}
