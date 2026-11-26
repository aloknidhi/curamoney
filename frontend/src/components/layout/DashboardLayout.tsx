"use client"

import { Sidebar } from "@/components/layout/Sidebar"
import { Navbar } from "@/components/layout/Navbar"
import { Outlet, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useEffect } from "react"

export default function DashboardLayout() {
  const { isAuthenticated, isLoading, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login")
    }
  }, [isAuthenticated, isLoading, navigate])

  if (isLoading) return null

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onLogout={logout} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
