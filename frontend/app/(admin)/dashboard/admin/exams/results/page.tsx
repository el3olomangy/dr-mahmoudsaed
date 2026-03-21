"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  ArrowRight, CheckCircle, XCircle, Users,
  TrendingUp, Clock, BarChart2, Search,
} from "lucide-react"
import { examsAPI } from "@/lib/api"
import { Input } from "@/components/ui/input"

interface StudentResult {
  student_id: string
  student_name: string
  score: number
  passed: boolean
  submitted_at: string
  earned_points: number
  total_points: number
}

interface ExamInfo {
  id: string
  title: string
  pass_score: number
  total_results: number
  pass_rate: number
  avg_score: number
}

function ResultsInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const examId = searchParams.get("id")

  const [results, setResults] = useState<StudentResult[]>([])
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!examId) { setError("مفيش ID للاختبار"); setIsLoading(false); return }

    const load = async () => {
      try {
        const [examData, resultsData] = await Promise.all([
          examsAPI.getExamForAdmin(examId) as Promise<any>,
          examsAPI.getResults(examId) as Promise<any[]>,
        ])

        setExamInfo({
          id: examId,
          title: examData.title,
          pass_score: examData.pass_score,
          total_results: resultsData.length,
          pass_rate: resultsData.length > 0
            ? Math.round(resultsData.filter(r => r.passed).length / resultsData.length * 100)
            : 0,
          avg_score: resultsData.length > 0
            ? Math.round(resultsData.reduce((s, r) => s + r.score, 0) / resultsData.length)
            : 0,
        })
        setResults(resultsData)
      } catch (err: any) {
        setError(err.message || "حصل خطأ في تحميل النتائج")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [examId])

  const filtered = results.filter(r =>
    r.student_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.student_id?.includes(search)
  )

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })
    } catch { return dateStr }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowRight className="w-4 h-4 ml-2" />رجوع
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto" dir="rtl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">نتائج الطلاب</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{examInfo?.title}</p>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-extrabold text-foreground">{results.length}</p>
            <p className="text-xs text-muted-foreground">إجمالي الطلاب</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-extrabold text-green-600">{results.filter(r => r.passed).length}</p>
            <p className="text-xs text-muted-foreground">ناجحين</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <XCircle className="w-6 h-6 text-destructive mx-auto mb-2" />
            <p className="text-2xl font-extrabold text-destructive">{results.filter(r => !r.passed).length}</p>
            <p className="text-xs text-muted-foreground">راسبين</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-chart-4 mx-auto mb-2" />
            <p className="text-2xl font-extrabold text-foreground">{examInfo?.avg_score}%</p>
            <p className="text-xs text-muted-foreground">متوسط الدرجات</p>
          </CardContent>
        </Card>
      </div>

      {/* نسبة النجاح */}
      {results.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-foreground">نسبة النجاح</span>
              <span className="text-sm font-bold text-primary">{examInfo?.pass_rate}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="h-3 rounded-full bg-primary transition-all"
                style={{ width: `${examInfo?.pass_rate}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              درجة النجاح المطلوبة: {examInfo?.pass_score}%
            </p>
          </CardContent>
        </Card>
      )}

      {/* قائمة النتائج */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              النتائج التفصيلية
            </CardTitle>
            {results.length > 0 && (
              <div className="relative w-48">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث باسم الطالب..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pr-9 h-8 text-sm"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {results.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">مفيش طلاب عملوا الاختبار ده لسه</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              مفيش نتايج مطابقة للبحث
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((r, idx) => (
                <div key={r.student_id + idx} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${r.passed ? "bg-green-500" : "bg-destructive"}`}>
                      {r.passed ? "✓" : "✗"}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{r.student_name || "طالب"}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(r.submitted_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className={`text-lg font-extrabold ${r.passed ? "text-green-600" : "text-destructive"}`}>
                        {Math.round(r.score)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.earned_points} / {r.total_points}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${r.passed ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-destructive/10 text-destructive"}`}>
                      {r.passed ? "ناجح" : "راسب"}
                    </span>
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

export default function ExamResultsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-4 max-w-4xl mx-auto p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    }>
      <ResultsInner />
    </Suspense>
  )
}