"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ClipboardCheck, Plus, Trash2, RefreshCw, Calendar, BookOpen, Eye,
} from "lucide-react"
import { examsAPI, coursesAPI } from "@/lib/api"

interface Homework {
  id: string
  title: string
  lecture_id: string
  course_id: string
  deadline?: string
  pass_score: number
}

interface Course {
  id: string
  title: string
}

export default function AssignmentsPage() {
  const router = useRouter()
  const [homeworks, setHomeworks] = useState<Homework[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    setError("")
    try {
      const coursesData = (await coursesAPI.getAll()) as Course[]
      setCourses(coursesData)

      // جيب الواجبات من كل الكورسات — فلتر is_homework: true
      const allHomeworks: Homework[] = []
      for (const course of coursesData) {
        try {
          const exams = (await examsAPI.getByCourse(course.id)) as any[]
          const courseHomeworks = exams.filter(e => e.is_homework === true)
          allHomeworks.push(...courseHomeworks)
        } catch {}
      }

      setHomeworks(allHomeworks)
    } catch (err: any) {
      setError(err.message || "حصل خطأ")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("هتحذف الواجب ده وكل تسليماته. متأكد؟")) return
    try {
      await examsAPI.deleteExam(id)
      setHomeworks(prev => prev.filter(h => h.id !== id))
    } catch (err: any) {
      alert(err.message || "حصل خطأ")
    }
  }

  const getCourseTitle = (courseId: string) =>
    courses.find(c => c.id === courseId)?.title || "—"

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">الواجبات</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? "..." : `${homeworks.length} واجب`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ml-2 ${isLoading ? "animate-spin" : ""}`} />
            تحديث
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => router.push("/dashboard/admin/assignments/new")}
          >
            <Plus className="w-4 h-4 ml-2" />
            واجب جديد
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-between">
          <p className="text-destructive text-sm">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchData}>إعادة المحاولة</Button>
        </div>
      )}

      {/* القائمة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            قائمة الواجبات
            {!isLoading && (
              <span className="text-sm font-normal text-muted-foreground">
                ({homeworks.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : homeworks.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">مفيش واجبات لسه</p>
              <p className="text-sm text-muted-foreground mt-1">ابدأ بإنشاء أول واجب</p>
              <Button
                className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => router.push("/dashboard/admin/assignments/new")}
              >
                <Plus className="w-4 h-4 ml-2" />
                واجب جديد
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {homeworks.map(hw => (
                <div key={hw.id} className="p-4 flex items-center gap-4">

                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <ClipboardCheck className="w-5 h-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{hw.title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {getCourseTitle(hw.course_id)}
                      </span>
                      {hw.deadline && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(hw.deadline).toLocaleDateString("ar-EG")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/dashboard/admin/assignments/${hw.id}`)}
                    >
                      <Eye className="w-4 h-4 ml-1" />
                      النتائج
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(hw.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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