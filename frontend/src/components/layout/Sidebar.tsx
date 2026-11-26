"use client"

import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Factory,
  CreditCard,
  Truck,
  FileText,
  BarChart3,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Processing", href: "/processing", icon: Factory },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Deliveries", href: "/deliveries", icon: Truck },
  { name: "Expenses", href: "/expenses", icon: FileText },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  useAuth();
  const navigate = useNavigate()

  return (
    <aside className="hidden md:flex md:w-64 flex-col border-r border-border bg-background">
      <div className="flex items-center gap-2 p-6">
        <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-sm">C</span>
        </div>
        <span className="font-bold text-xl tracking-tight">CuraMoney</span>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.href)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </button>
          )
        })}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Mill Operations
        </div>
        <button
          onClick={() => navigate("/settings/users")}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
        >
          <Users className="h-4 w-4" />
          Manage Users
        </button>
      </div>
    </aside>
  )
}

export function MobileSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col lg:hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-64 bg-background border-r border-border flex flex-col">
        <div className="flex items-center justify-between p-6">
          <span className="font-bold text-xl tracking-tight">CuraMoney</span>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <span className="relative z-10 block inline-block h-5 w-5 bg-neutral-200 rounded-lg group-hover:bg-neutral-300">
              <span className="absolute top-[2px] left-[2px] h-[1px] w-[1px] bg-black transition-all group-hover:translate-x-[2.5px]"></span>
              <span className="relative top-[-2.5px] left-[0.5px] block h-[1.5px] w-[2.5px] bg-black transition-all group-hover:rotate-45"></span>
              <span className="relative top-[-2.5px] left-[0.5px] block h-[1.5px] w-[2.5px] bg-black transition-all group-hover:-rotate-45"></span>
            </span>
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.name}
                onClick={() => { navigate(item.href); onClose() }}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                  "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
