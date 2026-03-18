"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, BookOpen, KeyRound, TrendingUp } from "lucide-react"
import { usersAPI, coursesAPI, codesAPI } from "@/lib/api"

interface Stats {
  totalStudents: number
  totalCourses: number
  activeCodes: number
  usedCodes: number
}

export default function AdminHomePage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [students, courses, codes] = await Promise.all([
          usersAPI.getAll() as Promise<any[]>,
          coursesAPI.getAll() as Promise<any[]>,
          codesAPI.getAll() as Promise<any[]>,
        ])
        setStats({
          totalStudents: students.length,
          totalCourses: courses.length,
          activeCodes: codes.filter((c: any) => c.status === "active").length,
          usedCodes: codes.filter((c: any) => c.status === "used").length,
        })
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statCards = [
    { label: "إجمالي الطلاب", value: stats?.totalStudents, icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "الكورسات", value: stats?.totalCourses, icon: BookOpen, color: "text-secondary", bg: "bg-secondary/10" },
    { label: "أكواد نشطة", value: stats?.activeCodes, icon: KeyRound, color: "text-chart-3", bg: "bg-chart-3/10" },
    { label: "أكواد مستخدمة", value: stats?.usedCodes, icon: TrendingUp, color: "text-chart-4", bg: "bg-chart-4/10" },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">لوحة التحكم</h1>
        <p className="text-muted-foreground mt-1">نظرة عامة على المنصة</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <Card key={i}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center ${card.color}`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mb-1" />
                ) : (
                  <p className="text-3xl font-extrabold text-foreground">{card.value ?? "—"}</p>
                )}
                <p className="text-sm text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { href: "/dashboard/admin/students", label: "إدارة الطلاب", desc: "عرض وإدارة حسابات الطلاب", icon: Users, color: "bg-primary" },
          { href: "/dashboard/admin/courses", label: "إدارة الكورسات", desc: "إضافة وتعديل الكورسات", icon: BookOpen, color: "bg-secondary" },
          { href: "/dashboard/admin/codes", label: "إدارة الأكواد", desc: "توليد وإدارة أكواد الاشتراك", icon: KeyRound, color: "bg-chart-3" },
        ].map((item) => (
          <a key={item.href} href={item.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${item.color}/10 flex items-center justify-center`}>
                  <item.icon className={`w-6 h-6 ${item.color.replace("bg-", "text-")}`} />
                </div>
                <div>
                  <p className="font-bold text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  )
}