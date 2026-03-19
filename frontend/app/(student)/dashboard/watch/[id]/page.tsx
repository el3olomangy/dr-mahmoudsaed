"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileCheck,
  AlertCircle,
} from "lucide-react"
import { coursesAPI, examsAPI } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

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

interface ExamInfo {
  id: string
  title: string
  duration_minutes: number
}

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: lectureId } = use(params)
  const { user } = useAuth()

  const [lecture, setLecture] = useState<Lecture | null>(null)
  const [courseId, setCourseId] = useState<string | null>(null)
  const [courseName, setCourseName] = useState<string>("")
  const [unitName, setUnitName] = useState<string>("")
  const [prevLectureId, setPrevLectureId] = useState<string | null>(null)
  const [nextLectureId, setNextLectureId] = useState<string | null>(null)
  const [exam, setExam] = useState<ExamInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [watermarkPosition, setWatermarkPosition] = useState({ x: 50, y: 50 })

  useEffect(() => {
    const interval = setInterval(() => {
      setWatermarkPosition({
        x: Math.random() * 60 + 20,
        y: Math.random() * 60 + 20,
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchLecture = async () => {
      setIsLoading(true)
      setError("")
      try {
        const courses = await coursesAPI.getAll() as any[]

        for (const course of courses) {
          if (!course.is_enrolled) continue
          const fullCourse = await coursesAPI.getOne(course.id) as any

          let allLectures: Lecture[] = []
          for (const unit of (fullCourse.units || [])) {
            allLectures = [...allLectures, ...unit.lectures]
          }

          const foundLecture = allLectures.find((l: Lecture) => l.id === lectureId)
          if (foundLecture) {
            const foundUnit = fullCourse.units.find((u: Unit) =>
              u.lectures.some((l: Lecture) => l.id === lectureId)
            )

            setLecture(foundLecture)
            setCourseId(course.id)
            setCourseName(fullCourse.title)
            setUnitName(foundUnit?.title || "")

            const idx = allLectures.findIndex((l: Lecture) => l.id === lectureId)
            setPrevLectureId(idx > 0 ? allLectures[idx - 1].id : null)
            setNextLectureId(idx < allLectures.length - 1 ? allLectures[idx + 1].id : null)

            try {
              const exams = await examsAPI.getByCourse(course.id) as any[]
              const lectureExam = exams.find((e: any) => e.lecture_id === lectureId)
              if (lectureExam) setExam(lectureExam)
            } catch {}

            break
          }
        }
      } catch (err: any) {
        setError(err.message || "حصل خطأ في تحميل المحاضرة")
      } finally {
        setIsLoading(false)
      }
    }

    fetchLecture()
  }, [lectureId])

  const studentWatermark = user
    ? `${user.first_name} ${user.last_name} - ${user.phone}`
    : ""

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-32" />
        <Card className="overflow-hidden">
          <Skeleton className="aspect-video w-full" />
          <CardContent className="p-4 md:p-6 space-y-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-7 w-3/4" />
            <div className="flex justify-between pt-2">
              <Skeleton className="h-10 w-36" />
              <Skeleton className="h-10 w-36" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !lecture) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">مش قادر أحمل المحاضرة</h2>
        <p className="text-muted-foreground mb-6">{error || "المحاضرة مش موجودة أو مش مشترك فيها"}</p>
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
      <Link
        href={courseId ? `/dashboard/courses/${courseId}` : "/dashboard/courses"}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        <span>العودة للكورس</span>
      </Link>

      <Card className="overflow-hidden">
        <div className="relative aspect-video bg-black">
          {lecture.video_url ? (
            <>
              <iframe
                src={lecture.video_url}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              {studentWatermark && (
                <div
                  className="absolute text-white/40 text-sm font-bold pointer-events-none select-none transition-all duration-1000 z-10"
                  style={{
                    left: `${watermarkPosition.x}%`,
                    top: `${watermarkPosition.y}%`,
                    transform: "translate(-50%, -50%)",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                  }}
                >
                  {studentWatermark}
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/60">
              <p>الفيديو مش متاح</p>
            </div>
          )}
        </div>

        <CardContent className="p-4 md:p-6">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-1">
              {courseName}
              {unitName && <> &bull; {unitName}</>}
              {lecture.duration_minutes && <> &bull; {lecture.duration_minutes} دقيقة</>}
            </p>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              {lecture.title}
            </h1>
            {lecture.description && (
              <p className="text-muted-foreground mt-2 text-sm">{lecture.description}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              disabled={!prevLectureId}
              asChild={!!prevLectureId}
            >
              {prevLectureId ? (
                <Link href={`/dashboard/watch/${prevLectureId}`} className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4" />
                  المحاضرة السابقة
                </Link>
              ) : (
                <span className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4" />
                  المحاضرة السابقة
                </span>
              )}
            </Button>

            <Button
              disabled={!nextLectureId}
              asChild={!!nextLectureId}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {nextLectureId ? (
                <Link href={`/dashboard/watch/${nextLectureId}`} className="flex items-center gap-2">
                  المحاضرة التالية
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              ) : (
                <span className="flex items-center gap-2">
                  المحاضرة التالية
                  <ChevronLeft className="w-4 h-4" />
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {(lecture.pdf_url || exam) && (
        <div className="grid md:grid-cols-2 gap-4">
          {lecture.pdf_url && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-secondary" />
                  ملف الشرح
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <a href={lecture.pdf_url} target="_blank" rel="noopener noreferrer">
                    عرض الملف
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}

          {exam && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-chart-4" />
                  اختبار المحاضرة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  {exam.title} &bull; {exam.duration_minutes} دقيقة
                </p>
                <Button asChild className="w-full bg-chart-4 hover:bg-chart-4/90 text-white">
                  <Link href={`/dashboard/exam/${exam.id}`}>
                    ابدأ الاختبار
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}