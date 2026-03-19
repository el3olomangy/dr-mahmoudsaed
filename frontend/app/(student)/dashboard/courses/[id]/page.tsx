"use client"

import { useEffect, useState, use } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  PlayCircle,
  FileText,
  Lock,
  ArrowRight,
  AlertCircle,
  BookOpen,
  Clock,
} from "lucide-react"
import { coursesAPI } from "@/lib/api"

interface Lecture {
  id: string
  title: string
  description?: string
  video_url?: string
  pdf_url?: string
  order: number
  lecture_type: string
  duration_minutes?: number
  is_enrolled: boolean
}

interface Unit {
  id: string
  title: string
  order: number
  lectures: Lecture[]
}

interface Course {
  id: string
  title: string
  description?: string
  grade: string
  price?: number
  thumbnail?: string
  units: Unit[]
  is_enrolled: boolean
}

const gradeLabels: Record<string, string> = {
  first_secondary: "الصف الأول الثانوي",
  second_secondary: "الصف الثاني الثانوي",
  third_secondary: "الصف الثالث الثانوي",
}

function getLectureIcon(lecture: Lecture) {
  if (!lecture.is_enrolled) return <Lock className="w-5 h-5 text-muted-foreground" />
  if (lecture.pdf_url && !lecture.video_url) return <FileText className="w-5 h-5 text-secondary" />
  return <PlayCircle className="w-5 h-5 text-primary" />
}

export default function CourseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params)
  const [course, setCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchCourse = async () => {
      setIsLoading(true)
      setError("")
      try {
        const data = await coursesAPI.getOne(courseId) as Course
        setCourse(data)
      } catch (err: any) {
        setError(err.message || "حصل خطأ في تحميل الكورس")
      } finally {
        setIsLoading(false)
      }
    }
    fetchCourse()
  }, [courseId])

  const totalLectures = course?.units.flatMap(u => u.lectures).length || 0

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-32" />
        <Card className="overflow-hidden">
          <Skeleton className="aspect-3/1 w-full" />
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">مش قادر أحمل الكورس</h2>
        <p className="text-muted-foreground mb-6">{error || "الكورس مش موجود"}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/courses">
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للكورسات
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* زر الرجوع */}
      <Link
        href="/dashboard/courses"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        <span>العودة للكورسات</span>
      </Link>

      {/* هيدر الكورس */}
      <Card className="overflow-hidden">
        <div className="relative aspect-3/1 bg-muted">
          {course.thumbnail ? (
            <Image
              src={course.thumbnail}
              alt={course.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-0 right-0 left-0 p-6 text-white">
            <h1 className="text-2xl md:text-3xl font-extrabold mb-2">{course.title}</h1>
            {course.description && (
              <p className="text-white/80 text-sm md:text-base max-w-2xl line-clamp-2">
                {course.description}
              </p>
            )}
          </div>
        </div>

        <CardContent className="p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <PlayCircle className="w-4 h-4" />
              {totalLectures} محاضرة
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {gradeLabels[course.grade] || course.grade}
            </span>
            {!course.is_enrolled && (
              <span className="text-destructive font-medium">غير مشترك</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* محتوى الكورس */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">محتوى الكورس</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {course.units.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">مفيش محاضرات متاحة دلوقتي</p>
            </div>
          ) : (
            <Accordion
              type="multiple"
              defaultValue={course.units.map(u => `unit-${u.id}`)}
              className="w-full"
            >
              {course.units.map((unit, unitIdx) => (
                <AccordionItem key={unit.id} value={`unit-${unit.id}`} className="border-b border-border">
                  <AccordionTrigger className="px-4 md:px-6 py-4 hover:bg-muted/50 hover:no-underline">
                    <div className="flex items-center gap-3 text-right">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {unitIdx + 1}
                      </div>
                      <span className="font-bold">{unit.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0">
                    <div className="divide-y divide-border">
                      {unit.lectures.map((lecture) => {
                        const rowClass = `flex items-center gap-4 px-4 md:px-6 py-4 hover:bg-muted/50 transition-colors ${!lecture.is_enrolled ? "opacity-50 cursor-not-allowed" : ""}`
                        const inner = (
                          <>
                            <div className="shrink-0">{getLectureIcon(lecture)}</div>
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-medium ${!lecture.is_enrolled ? "text-muted-foreground" : "text-foreground"}`}>
                                {lecture.title}
                              </h4>
                              {lecture.duration_minutes && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {lecture.duration_minutes} دقيقة
                                </p>
                              )}
                            </div>
                            {!lecture.is_enrolled && (
                              <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                            )}
                          </>
                        )
                        if (!lecture.is_enrolled) {
                          return <div key={lecture.id} className={rowClass}>{inner}</div>
                        }
                        if (lecture.video_url) {
                          return <Link key={lecture.id} href={`/dashboard/watch/${lecture.id}`} className={rowClass}>{inner}</Link>
                        }
                        if (lecture.pdf_url) {
                          return <a key={lecture.id} href={lecture.pdf_url} target="_blank" rel="noopener noreferrer" className={rowClass}>{inner}</a>
                        }
                        return <div key={lecture.id} className={rowClass}>{inner}</div>
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  )
}