"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, PlayCircle, FileCheck, ArrowLeft, KeyRound } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { coursesAPI } from "@/lib/api"
import { getImageUrl } from "@/lib/utils/image"

interface Course {
  id: string
  title: string
  thumbnail?: string
  lectures_count: number
  is_enrolled: boolean
}

export default function DashboardPage() {
  const { user, updateUser } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await coursesAPI.getAll() as Course[]
        // فلتر الكورسات المشترك فيها بالموجودة فعلاً فقط
        const existingIds = new Set(data.map((c: Course) => c.id))
        const validEnrolled = (user?.enrolled_courses || []).filter(id => existingIds.has(id))
        if (validEnrolled.length !== (user?.enrolled_courses || []).length) {
          updateUser({ enrolled_courses: validEnrolled })
        }
        setCourses(data.slice(0, 3))
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchCourses()
  }, [])

  const enrolledCount = courses.filter(c => c.is_enrolled).length

  const stats = [
    { label: "كورساتي", value: enrolledCount.toString(), icon: BookOpen, color: "text-primary" },
    { label: "فيديوهات مشاهدة", value: "—", icon: PlayCircle, color: "text-secondary" },
    { label: "اختبارات محلولة", value: "—", icon: FileCheck, color: "text-chart-3" },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-linear-to-l from-primary to-primary/80 rounded-2xl p-6 lg:p-8 text-white">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-extrabold mb-2">
              أهلاً بيك يا {user?.first_name || "..."}!
            </h1>
            <p className="text-white/80 mb-4">واصل مشوارك في رحلة التفوق معانا</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary" className="bg-white text-primary hover:bg-white/90">
                <Link href="/dashboard/courses">
                  <BookOpen className="w-4 h-4 ml-2" />
                  اشتراكاتك
                </Link>
              </Button>
              <Button asChild className="bg-white text-primary hover:bg-white/90 font-bold">
                <Link href="/dashboard/activate">
                  <KeyRound className="w-4 h-4 ml-2" />
                  فعّل كود
                </Link>
              </Button>
            </div>
          </div>
          <div className="hidden md:block">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/teacher_pic-mGYVNXqSPGIcSjUAjZ1jmoFlCHW4n6.png"
              alt="د. محمود سعيد"
              width={150}
              height={150}
              className="h-32 w-auto"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4 lg:p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                {isLoading && index === 0 ? (
                  <Skeleton className="h-8 w-10 mb-1" />
                ) : (
                  <p className="text-2xl lg:text-3xl font-extrabold text-foreground">{stat.value}</p>
                )}
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Courses */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold">أحدث الكورسات</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/courses" className="flex items-center gap-1">
              عرض الكل
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl overflow-hidden border border-border">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-9 w-full mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">مفيش كورسات متاحة دلوقتي</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <div key={course.id} className="group bg-muted/50 rounded-xl overflow-hidden border border-border hover:border-primary/30 transition-colors">
                  <div className="relative aspect-video bg-muted">
                    {course.thumbnail ? (
                      <img src={getImageUrl(course.thumbnail) || ""} alt={course.title} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-muted-foreground" />
                      </div>
                    )}
                    {!course.is_enrolled && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-bold">غير مشترك</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-foreground mb-1">{course.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{course.lectures_count} محاضرة</p>
                    {course.is_enrolled ? (
                      <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Link href={`/dashboard/courses/${course.id}`}>الدخول على الكورس</Link>
                      </Button>
                    ) : (
                      <Button asChild className="w-full bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/30 hover:border-primary">
                        <Link href="/dashboard/activate">
                          <KeyRound className="w-4 h-4 ml-2" />
                          ادخل كود الاشتراك
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}