"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, BookOpen, KeyRound, TrendingUp, UserPlus, CheckCircle } from "lucide-react"
import { statsAPI } from "@/lib/api"

interface Overview {
  students: {
    total: number
    active: number
    inactive: number
    new_this_week: number
  }
  courses: {
    total: number
    active: number
  }
  codes: {
    total: number
    used: number
    available: number
    usage_rate: number
  }
  exams: {
    total: number
    submissions: number
    pass_rate: number
  }
}

interface TopCourse {
  course_id: string
  title: string
  grade: string
  subscribers: number
}

export default function AdminHomePage() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [topCourses, setTopCourses] = useState<TopCourse[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [ov, courses] = await Promise.all([
          statsAPI.getOverview() as Promise<Overview>,
          statsAPI.getTopCourses() as Promise<TopCourse[]>,
        ])
        setOverview(ov)
        setTopCourses(courses.slice(0, 5))
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statCards = [
    {
      label: "إجمالي الطلاب",
      value: overview?.students.total,
      sub: `${overview?.students.new_this_week ?? 0} جديد هذا الأسبوع`,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "الكورسات",
      value: overview?.courses.total,
      sub: `${overview?.courses.active ?? 0} كورس نشط`,
      icon: BookOpen,
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      label: "أكواد متاحة",
      value: overview?.codes.available,
      sub: `${overview?.codes.usage_rate ?? 0}% نسبة الاستخدام`,
      icon: KeyRound,
      color: "text-chart-3",
      bg: "bg-chart-3/10",
    },
    {
      label: "نسبة النجاح",
      value: overview ? `${overview.exams.pass_rate}%` : null,
      sub: `${overview?.exams.submissions ?? 0} تسليم اختبار`,
      icon: TrendingUp,
      color: "text-chart-4",
      bg: "bg-chart-4/10",
    },
  ]

  const gradeLabel: Record<string, string> = {
    first_secondary: "أول ثانوي",
    second_secondary: "ثاني ثانوي",
    third_secondary: "ثالث ثانوي",
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">لوحة التحكم</h1>
        <p className="text-muted-foreground mt-1">نظرة عامة على المنصة</p>
      </div>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <Card key={i}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center ${card.color} shrink-0`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mb-1" />
                ) : (
                  <p className="text-3xl font-extrabold text-foreground">{card.value ?? "—"}</p>
                )}
                <p className="text-sm text-muted-foreground">{card.label}</p>
                {!isLoading && (
                  <p className="text-xs text-muted-foreground/70 mt-0.5">{card.sub}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* أكثر الكورسات اشتراكاً */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-secondary" />
              أكثر الكورسات اشتراكاً
            </h2>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : topCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">لا يوجد بيانات بعد</p>
            ) : (
              <div className="space-y-3">
                {topCourses.map((course, i) => (
                  <div key={course.course_id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-muted-foreground w-5 text-center">{i + 1}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{course.title}</p>
                        <p className="text-xs text-muted-foreground">{gradeLabel[course.grade] ?? course.grade}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-primary shrink-0">
                      <Users className="w-3 h-3" />
                      <span className="text-sm font-bold">{course.subscribers}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* روابط سريعة */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              روابط سريعة
            </h2>
            <div className="space-y-3">
              {[
                { href: "/dashboard/admin/students", label: "إدارة الطلاب", desc: "عرض وإدارة حسابات الطلاب", icon: Users, color: "bg-primary" },
                { href: "/dashboard/admin/courses", label: "إدارة الكورسات", desc: "إضافة وتعديل الكورسات", icon: BookOpen, color: "bg-secondary" },
                { href: "/dashboard/admin/codes", label: "إدارة الأكواد", desc: "توليد وإدارة أكواد الاشتراك", icon: KeyRound, color: "bg-chart-3" },
                { href: "/dashboard/admin/students", label: "طلاب جدد", desc: `${overview?.students.new_this_week ?? 0} طالب هذا الأسبوع`, icon: UserPlus, color: "bg-chart-4" },
              ].map((item) => (
                <a key={item.href + item.label} href={item.href}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className={`w-9 h-9 rounded-lg ${item.color}/10 flex items-center justify-center shrink-0`}>
                      <item.icon className={`w-4 h-4 ${item.color.replace("bg-", "text-")}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}