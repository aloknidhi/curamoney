"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Menu, Bell, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MobileSidebar } from "@/components/layout/Sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function Navbar({ onLogout }: { onLogout: () => void }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-background bg-background/80 backdrop-blur px-6">
      <button
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        className="md:hidden flex items-center justify-center text-muted-foreground hover:text-neutral-900"
      >
        <Menu className="h-5 w-5" />
      </button>

      <Link to="/dashboard" className="mr-auto flex items-center gap-2">
        <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-sm">C</span>
        </div>
        <span className="font-bold text-lg tracking-tight">CuraMoney</span>
      </Link>

      <div className="flex items-center gap-4">
        <button className="text-muted-foreground hover:text-neutral-900">
          <Bell className="h-5 w-5" />
        </button>

        <button
          onClick={() => setIsDark(!isDark)}
          className="text-muted-foreground hover:text-neutral-900"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <div className="flex items-center gap-2 pl-4 border-l border-border">
          <div className="hidden md:flex flex-col items-end">
            <p className="text-sm font-medium text-neutral-900">{user?.name || "User"}</p>
            <p className="text-xs text-neutral-500 capitalize">{user?.role || ""}</p>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={onLogout} className="h-8 w-8">
              <LogOutIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <MobileSidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />
    </header>
  )
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
