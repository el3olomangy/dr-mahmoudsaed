"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowRight, CheckCircle, Clock, User,
  ChevronDown, ChevronUp, AlertCircle,
  ClipboardCheck, TrendingUp,
} from "lucide-react"
import { examsAPI } from "@/lib/api"

interface Result {
  student_id: string
  student_name?: string
  score: number
  passed: boolean
  submitted_at: string
}

interface HomeworkInfo {
  id: string
  title: string
  pass_score: number
  deadline?: string
}

export default function AssignmentResultsPage() {
  const router = useRouter()
  const params = useParams()
  const homeworkId = params.id as string

  const [homework, setHomework] = useState<HomeworkInfo | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchData()
  }, [homeworkId])

  const fetchData = async () => {
    setIsLoading(true)
    setError("")
    try {
      // جيب بيانات الواجب
      const hw = (await examsAPI.getExamForAdmin(homeworkId)) as any
      setHomework(hw)

      // جيب نتائج الطلاب
      const res = (await examsAPI.getMyResult(homeworkId)) as Result[]
      setResults(res)

      if (res.length > 0) {
        setExpandedIds(new Set([res[0].student_id]))
      }
    } catch (err: any) {
      setError(err.message || "حصل خطأ")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const passedCount = results.filter(r => r.passed).length

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-20" dir="rtl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            {homework?.title || "نتائج الواجب"}
          </h1>
          {!isLoading && (
            <p className="text-muted-foreground text-sm mt-0.5">
              {results.length} طالب — {passedCount} ناجح
            </p>
          )}
        </div>
      </div>

      {/* ملخص */}
      {!isLoading && results.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-muted/50 rounded-xl text-center">
            <p className="text-2xl font-extrabold text-foreground">{results.length}</p>
            <p className="text-xs text-muted-foreground mt-1">سلّموا الواجب</p>
          </div>
          <div className="p-4 bg-chart-3/10 rounded-xl text-center">
            <p className="text-2xl font-extrabold text-chart-3">{passedCount}</p>
            <p className="text-xs text-muted-foreground mt-1">ناجحين</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-xl text-center">
            <p className="text-2xl font-extrabold text-foreground">
              {results.length > 0
                ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
                : 0}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">متوسط الدرجات</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      )}

      {/* مفيش نتائج */}
      {!isLoading && results.length === 0 && !error && (
        <Card>
          <CardContent className="py-16 text-center">
            <ClipboardCheck className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">مفيش طلاب سلّموا لسه</p>
          </CardContent>
        </Card>
      )}

      {/* قائمة النتائج */}
      {!isLoading && results.map((result, idx) => {
        const expanded = expandedIds.has(result.student_id + idx)

        return (
          <Card key={result.student_id + idx} className={result.passed ? "border-green-500/30" : ""}>
            <div
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={() => toggleExpand(result.student_id + idx)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  result.passed ? "bg-green-500/10" : "bg-destructive/10"
                }`}>
                  {result.passed
                    ? <CheckCircle className="w-5 h-5 text-green-500" />
                    : <User className="w-5 h-5 text-destructive" />
                  }
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">
                    {result.student_name || result.student_id}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(result.submitted_at).toLocaleDateString("ar-EG")}
                    </span>
                    <span className={`text-xs font-bold ${result.passed ? "text-green-600" : "text-destructive"}`}>
                      {result.passed ? "ناجح" : "راسب"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-left">
                  <p className={`text-lg font-extrabold ${result.passed ? "text-green-600" : "text-destructive"}`}>
                    {Math.round(result.score)}%
                  </p>
                </div>
                {expanded
                  ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                }
              </div>
            </div>

            {expanded && (
              <CardContent className="pt-0">
                <div className="border-t border-border mb-4" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  <span>الدرجة: <strong className="text-foreground">{Math.round(result.score)}%</strong></span>
                  <span className="mx-2">—</span>
                  <span>درجة النجاح: <strong className="text-foreground">{homework?.pass_score}%</strong></span>
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}

    </div>
  )
}