"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  BookOpen,
  KeyRound,
  Bell,
  LogOut,
  Menu,
  ChevronLeft,
} from "lucide-react"

const menuItems = [
  { href: "/dashboard/admin", label: "الرئيسية", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/admin/students", label: "الطلاب", icon: Users },
  { href: "/dashboard/admin/courses", label: "الكورسات", icon: BookOpen },
  { href: "/dashboard/admin/codes", label: "الأكواد", icon: KeyRound },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user?.role === "student"))) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, user, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated || user?.role === "student") return null

  const isActive = (item: typeof menuItems[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 right-0 z-50 h-full w-72 bg-card border-l border-border flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
        sidebarOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Logo */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <Link href="/dashboard/admin">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-BuyHgoZLI0SWgDwWIvZe8lSxWIu1dX.png"
              alt="العلومنجي"
              width={130} height={45}
              className="h-9 w-auto"
            />
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-md hover:bg-muted">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* User */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-extrabold text-lg">
                {user?.first_name?.[0]}
              </span>
            </div>
            <div>
              <p className="font-bold text-foreground">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-muted-foreground">
                {user?.role === "teacher" ? "مدرس" : "مساعد"}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                isActive(item)
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={logout}
          >
            <LogOut className="w-5 h-5" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden sticky top-0 z-30 bg-background border-b border-border px-4 h-16 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md hover:bg-muted">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-foreground">لوحة التحكم</span>
          <div className="w-10" />
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}