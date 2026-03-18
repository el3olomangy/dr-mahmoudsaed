"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Phone, 
  ArrowRight, 
  User, 
  BookOpen, 
  PlayCircle, 
  FileCheck,
  Calendar,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react"

// Mock student data
const studentData = {
  firstName: "محمد",
  lastName: "أحمد",
  phone: "01012345678",
  grade: "الصف الثالث الثانوي",
  governorate: "القاهرة",
  courses: [
    {
      id: 1,
      name: "الكيمياء العضوية",
      progress: 65,
      totalLectures: 24,
      completedLectures: 16,
    },
    {
      id: 2,
      name: "الفيزياء الحديثة",
      progress: 40,
      totalLectures: 18,
      completedLectures: 7,
    },
  ],
  stats: {
    videosWatched: 24,
    examsTaken: 12,
    averageScore: 85,
    totalWatchTime: "12 ساعة",
  },
  attendance: [
    { date: "15 مارس 2026", lecture: "الألدهيدات والكيتونات", status: "present" },
    { date: "14 مارس 2026", lecture: "الهيدروكربونات", status: "present" },
    { date: "13 مارس 2026", lecture: "الفيزياء الحديثة - الكم", status: "absent" },
    { date: "12 مارس 2026", lecture: "مقدمة في الكيمياء العضوية", status: "present" },
    { date: "11 مارس 2026", lecture: "الدرس التمهيدي", status: "present" },
  ],
  recentExams: [
    { name: "اختبار الوحدة الأولى - كيمياء", score: 90, date: "14 مارس 2026" },
    { name: "اختبار الهيدروكربونات", score: 85, date: "12 مارس 2026" },
    { name: "اختبار الفيزياء الحديثة", score: 78, date: "10 مارس 2026" },
  ],
}

export default function ParentTrackingPage() {
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showData, setShowData] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) return

    setIsLoading(true)
    setError("")

    // TODO: Implement actual API call
    setTimeout(() => {
      setIsLoading(false)
      if (phone === "01098765432") {
        setShowData(true)
      } else {
        setError("لم يتم العثور على طالب مرتبط بهذا الرقم. تأكد من الرقم وحاول مرة أخرى")
      }
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <Image 
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-BuyHgoZLI0SWgDwWIvZe8lSxWIu1dX.png"
              alt="العلومنجي"
              width={120}
              height={40}
              className="h-8 w-auto"
            />
          </Link>
          <Link 
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="text-sm">العودة للرئيسية</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!showData ? (
          /* Phone Entry Form */
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-secondary" />
                </div>
                <CardTitle className="text-2xl font-extrabold">متابعة ولي الأمر</CardTitle>
                <CardDescription>
                  أدخل رقم هاتفك المسجل كولي أمر لمتابعة تقدم ابنك/ابنتك
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="01xxxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pr-10 text-left py-6"
                      dir="ltr"
                      required
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
                      {error}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold py-6"
                    disabled={isLoading}
                  >
                    {isLoading ? "جاري البحث..." : "عرض بيانات الطالب"}
                  </Button>
                </form>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  ملاحظة: يجب أن يكون رقم الهاتف مسجلاً كرقم ولي أمر في حساب الطالب
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Student Data Display */
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowData(false)
                setPhone("")
              }}
              className="flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              بحث عن طالب آخر
            </Button>

            {/* Student Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-10 h-10 text-primary" />
                  </div>
                  <div className="text-center md:text-right flex-1">
                    <h1 className="text-2xl font-extrabold text-foreground">
                      {studentData.firstName} {studentData.lastName}
                    </h1>
                    <p className="text-muted-foreground">{studentData.grade}</p>
                    <p className="text-sm text-muted-foreground">{studentData.governorate}</p>
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-sm text-muted-foreground">رقم الطالب</p>
                    <p className="font-mono font-bold" dir="ltr">{studentData.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <PlayCircle className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-extrabold">{studentData.stats.videosWatched}</p>
                  <p className="text-xs text-muted-foreground">فيديو مشاهدة</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <FileCheck className="w-8 h-8 text-chart-4 mx-auto mb-2" />
                  <p className="text-2xl font-extrabold">{studentData.stats.examsTaken}</p>
                  <p className="text-xs text-muted-foreground">اختبار محلول</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-chart-3 mx-auto mb-2" />
                  <p className="text-2xl font-extrabold">{studentData.stats.averageScore}%</p>
                  <p className="text-xs text-muted-foreground">متوسط النتائج</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="w-8 h-8 text-secondary mx-auto mb-2" />
                  <p className="text-2xl font-extrabold">{studentData.stats.totalWatchTime}</p>
                  <p className="text-xs text-muted-foreground">وقت المشاهدة</p>
                </CardContent>
              </Card>
            </div>

            {/* Courses Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  الكورسات المسجلة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {studentData.courses.map((course) => (
                    <div key={course.id} className="p-4 bg-muted/50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold">{course.name}</h3>
                        <span className="text-primary font-bold">{course.progress}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {course.completedLectures} من {course.totalLectures} محاضرة
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Exams */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5" />
                  آخر الاختبارات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {studentData.recentExams.map((exam, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                      <div>
                        <p className="font-medium">{exam.name}</p>
                        <p className="text-sm text-muted-foreground">{exam.date}</p>
                      </div>
                      <div className={`text-xl font-extrabold ${exam.score >= 80 ? 'text-chart-3' : exam.score >= 50 ? 'text-chart-4' : 'text-destructive'}`}>
                        {exam.score}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Attendance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  سجل الحضور والغياب
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {studentData.attendance.map((record, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-muted/50 rounded-xl">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${record.status === 'present' ? 'bg-chart-3/10' : 'bg-destructive/10'}`}>
                        {record.status === 'present' ? (
                          <CheckCircle className="w-5 h-5 text-chart-3" />
                        ) : (
                          <XCircle className="w-5 h-5 text-destructive" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{record.lecture}</p>
                        <p className="text-sm text-muted-foreground">{record.date}</p>
                      </div>
                      <span className={`text-sm font-bold ${record.status === 'present' ? 'text-chart-3' : 'text-destructive'}`}>
                        {record.status === 'present' ? 'حاضر' : 'غائب'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
