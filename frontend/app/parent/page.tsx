"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Phone,
  ArrowRight,
  User,
  BookOpen,
  KeyRound,
  GraduationCap,
  MapPin,
  PlayCircle,
  FileCheck,
  TrendingUp,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { usersAPI } from "@/lib/api";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

interface EnrolledCourse {
  id: string;
  title: string;
}

interface CourseProgress {
  watched: number;
  total_lectures: number;
  percentage: number;
  exam_stats: { taken: number; passed: number };
}

interface StudentData {
  id: string;
  first_name: string;
  last_name: string;
  grade?: string;
  governorate?: string;
  enrolled_courses: EnrolledCourse[];
}

const gradeLabels: Record<string, string> = {
  first_secondary: "الصف الأول الثانوي",
  second_secondary: "الصف الثاني الثانوي",
  third_secondary: "الصف الثالث الثانوي",
};

export default function ParentTrackingPage() {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [progress, setProgress] = useState<Record<string, CourseProgress>>({});
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setIsLoading(true);
    setError("");
    setStudent(null);

    try {
      // endpoint واحد بيجيب الطالب وتقدمه في آن واحد
      const res = await fetch(`${BASE_URL}/progress/parent/${phone.trim()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "مفيش طالب مرتبط بالرقم ده");
      }
      const result = await res.json();

      // حوّل البيانات للشكل اللي الـ UI بيتوقعه
      const progressMap: Record<string, CourseProgress> = {};
      result.courses_progress.forEach((cp: any) => {
        progressMap[cp.course_id] = {
          watched: cp.watched,
          total_lectures: cp.total_lectures,
          percentage: cp.percentage,
          exam_stats: cp.exam_stats,
        };
      });
      setProgress(progressMap);

      const studentData: StudentData = {
        id: result.student.id,
        first_name: result.student.first_name,
        last_name: result.student.last_name,
        grade: result.student.grade,
        governorate: result.student.governorate,
        enrolled_courses: result.courses_progress.map((cp: any) => ({
          id: cp.course_id,
          title: cp.course_title,
        })),
      };
      setStudent(studentData);
    } catch (err: any) {
      setError(err.message || "مفيش طالب مرتبط بالرقم ده");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStudent(null);
    setPhone("");
    setError("");
    setProgress({});
  };

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
        {/* ====== فورم البحث ====== */}
        {!student && (
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-secondary" />
                </div>
                <CardTitle className="text-2xl font-extrabold">
                  متابعة ولي الأمر
                </CardTitle>
                <CardDescription>
                  أدخل رقم هاتفك المسجل كولي أمر لمتابعة بيانات ابنك/ابنتك
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
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setError("");
                      }}
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
                  لازم يكون الرقم مسجل كرقم ولي أمر في حساب الطالب
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ====== Loading ====== */}
        {isLoading && (
          <div className="max-w-2xl mx-auto space-y-4">
            <Skeleton className="h-32 rounded-2xl" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          </div>
        )}

        {/* ====== بيانات الطالب ====== */}
        {student && !isLoading && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* زرار البحث من جديد */}
            <Button
              variant="ghost"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              بحث عن طالب آخر
            </Button>

            {/* بيانات الطالب الأساسية */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-10 h-10 text-primary" />
                  </div>
                  <div className="text-center sm:text-right flex-1 space-y-2">
                    <h1 className="text-2xl font-extrabold text-foreground">
                      {student.first_name} {student.last_name}
                    </h1>
                    {student.grade && (
                      <p className="flex items-center gap-2 justify-center sm:justify-start text-muted-foreground">
                        <GraduationCap className="w-4 h-4" />
                        {gradeLabels[student.grade] || student.grade}
                      </p>
                    )}
                    {student.governorate && (
                      <p className="flex items-center gap-2 justify-center sm:justify-start text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {student.governorate}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* إحصائيات سريعة */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <BookOpen className="w-6 h-6 text-primary mx-auto mb-1" />
                  <p className="text-2xl font-extrabold text-foreground">
                    {student.enrolled_courses.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">كورس</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <PlayCircle className="w-6 h-6 text-chart-4 mx-auto mb-1" />
                  <p className="text-2xl font-extrabold text-foreground">
                    {Object.values(progress).reduce((s, p) => s + p.watched, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    محاضرة اتشافت
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <FileCheck className="w-6 h-6 text-chart-3 mx-auto mb-1" />
                  <p className="text-2xl font-extrabold text-foreground">
                    {Object.values(progress).reduce(
                      (s, p) => s + p.exam_stats.passed,
                      0,
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    اختبار اجتاز
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* الكورسات مع التقدم */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5" />
                  التقدم في الكورسات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {student.enrolled_courses.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      مش مشترك في أي كورس لسه
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {student.enrolled_courses.map((course) => {
                      const p = progress[course.id];
                      return (
                        <div
                          key={course.id}
                          className="border border-border rounded-xl p-4 space-y-3"
                        >
                          {/* اسم الكورس */}
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <BookOpen className="w-4 h-4 text-primary" />
                            </div>
                            <p className="font-bold text-sm text-foreground">
                              {course.title}
                            </p>
                          </div>

                          {loadingProgress ? (
                            <div className="h-3 bg-muted animate-pulse rounded-full" />
                          ) : p ? (
                            <>
                              {/* شريط التقدم */}
                              <div>
                                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                                  <span>التقدم الكلي</span>
                                  <span className="font-bold text-primary">
                                    {p.percentage}%
                                  </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                                  <div
                                    className="h-2.5 rounded-full transition-all duration-700"
                                    style={{
                                      width: `${p.percentage}%`,
                                      background:
                                        p.percentage >= 80
                                          ? "#22c55e"
                                          : p.percentage >= 40
                                            ? "#f59e0b"
                                            : "#3b82f6",
                                    }}
                                  />
                                </div>
                              </div>

                              {/* إحصائيات */}
                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-muted/50 rounded-lg p-2.5 flex items-center gap-2">
                                  <PlayCircle className="w-4 h-4 text-primary shrink-0" />
                                  <div>
                                    <p className="text-xs font-bold text-foreground">
                                      {p.watched} / {p.total_lectures}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      محاضرة
                                    </p>
                                  </div>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-2.5 flex items-center gap-2">
                                  <FileCheck className="w-4 h-4 text-chart-3 shrink-0" />
                                  <div>
                                    <p className="text-xs font-bold text-foreground">
                                      {p.exam_stats.passed} /{" "}
                                      {p.exam_stats.taken}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      اختبار اجتاز
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              لا توجد بيانات تقدم بعد
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ملاحظة */}
            <p className="text-xs text-muted-foreground text-center pb-4">
              للاستفسار عن تفاصيل أكتر تواصل مع الدعم الفني
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
