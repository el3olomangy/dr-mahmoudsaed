"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { StudentSidebar } from "@/components/student-sidebar"
import { Menu, Bell, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "next-themes"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isAuthenticated, isLoading } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <StudentSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header — ظاهر دايماً */}
        <header className="sticky top-0 z-30 bg-background border-b border-border px-4 h-16 flex items-center justify-between">

          {/* زرار الـ sidebar */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-muted"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div />

          {/* الأيقونات */}
          <div className="flex items-center gap-1">

            {/* زرار الثيم */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-md hover:bg-muted transition-colors"
              title={theme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}
            >
              {theme === "dark"
                ? <Sun className="w-5 h-5 text-amber-500" />
                : <Moon className="w-5 h-5 text-muted-foreground" />
              }
            </button>

            {/* الإشعارات */}
            <Link href="/dashboard/notifications">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 left-1 w-2 h-2 bg-primary rounded-full" />
              </Button>
            </Link>

          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}