"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Smartphone,
  ShieldOff,
  ChevronDown,
  ChevronUp,
  Trash2,
  BookOpen,
  PlayCircle,
  FileCheck,
} from "lucide-react";
import { usersAPI, progressAPI, coursesAPI } from "@/lib/api";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  grade?: string;
  governorate?: string;
  is_active: boolean;
  enrolled_courses: string[];
}

const gradeLabels: Record<string, string> = {
  first_secondary: "أولى ثانوي",
  second_secondary: "ثانية ثانوي",
  third_secondary: "ثالثة ثانوي",
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [courseNames, setCourseNames] = useState<Record<string, string>>({});
  const [studentProgress, setStudentProgress] = useState<Record<string, any>>(
    {},
  );

  useEffect(() => {
    fetchStudents();
    coursesAPI
      .getAll()
      .then((data: any) => {
        const names: Record<string, string> = {};
        data.forEach((c: any) => {
          names[c.id] = c.title;
        });
        setCourseNames(names);
      })
      .catch(() => {});
  }, []);

  const fetchStudents = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = (await usersAPI.getAll()) as Student[];
      setStudents(data);
    } catch (err: any) {
      setError(err.message || "حصل خطأ في تحميل الطلاب");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    setLoadingAction(`toggle-${id}`);
    try {
      await usersAPI.toggleActive(id);
      setStudents((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: !s.is_active } : s)),
      );
    } catch (err: any) {
      alert(err.message || "حصل خطأ");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResetDevice = async (id: string) => {
    if (!confirm("هتعمل reset للجهاز — الطالب هيقدر يسجل من جهاز جديد. متأكد؟"))
      return;
    setLoadingAction(`reset-${id}`);
    try {
      await usersAPI.resetDevice(id);
      alert("تم reset الجهاز بنجاح");
    } catch (err: any) {
      alert(err.message || "حصل خطأ");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`هتحذف حساب ${name} نهائياً — مش هيرجع. متأكد؟`)) return;
    setLoadingAction(`delete-${id}`);
    try {
      await usersAPI.deleteStudent(id);
      setStudents((prev) => prev.filter((s) => s.id !== id));
      setExpandedId(null);
    } catch (err: any) {
      alert(err.message || "حصل خطأ في الحذف");
    } finally {
      setLoadingAction(null);
    }
  };

  const filtered = students.filter((s) =>
    `${s.first_name} ${s.last_name} ${s.phone}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">الطلاب</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? "..." : `${students.length} طالب مسجل`}
          </p>
        </div>
        <Button variant="outline" onClick={fetchStudents} disabled={isLoading}>
          <RefreshCw
            className={`w-4 h-4 ml-2 ${isLoading ? "animate-spin" : ""}`}
          />
          تحديث
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="ابحث باسم الطالب أو الهاتف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-between">
          <p className="text-destructive text-sm">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchStudents}>
            إعادة المحاولة
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            قائمة الطلاب
            {!isLoading && search && (
              <span className="text-sm font-normal text-muted-foreground">
                ({filtered.length} نتيجة)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {search ? "مفيش نتائج للبحث ده" : "مفيش طلاب مسجلين لسه"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((student) => (
                <div key={student.id}>
                  {/* Row */}
                  <div className="p-4 flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                        student.is_active
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {student.first_name[0]}
                      {student.last_name[0]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground truncate">
                          {student.first_name} {student.last_name}
                        </p>
                        {!student.is_active && (
                          <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full shrink-0">
                            موقوف
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground" dir="ltr">
                        {student.phone}
                      </p>
                    </div>

                    <div className="hidden md:block text-sm text-muted-foreground text-left shrink-0">
                      <p>
                        {gradeLabels[student.grade || ""] ||
                          student.grade ||
                          "—"}
                      </p>
                      <p>{student.enrolled_courses.length} كورس</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant={student.is_active ? "destructive" : "default"}
                        className={
                          student.is_active
                            ? ""
                            : "bg-chart-3 hover:bg-chart-3/90 text-white"
                        }
                        disabled={loadingAction === `toggle-${student.id}`}
                        onClick={() => handleToggleActive(student.id)}
                      >
                        {loadingAction === `toggle-${student.id}` ? (
                          "..."
                        ) : student.is_active ? (
                          <>
                            <XCircle className="w-4 h-4 ml-1" />
                            إيقاف
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 ml-1" />
                            تفعيل
                          </>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const newId =
                            expandedId === student.id ? null : student.id;
                          setExpandedId(newId);
                          if (newId && student.enrolled_courses.length > 0) {
                            student.enrolled_courses.forEach(
                              (courseId: string) => {
                                const key = `${student.id}_${courseId}`;
                                if (!studentProgress[key]) {
                                  progressAPI
                                    .getStudentCourseProgress(
                                      student.id,
                                      courseId,
                                    )
                                    .then((p: any) =>
                                      setStudentProgress((prev) => ({
                                        ...prev,
                                        [key]: p,
                                      })),
                                    )
                                    .catch(() => {});
                                }
                              },
                            );
                          }
                        }}
                      >
                        {expandedId === student.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expandedId === student.id && (
                    <div className="px-4 pb-4 bg-muted/30 border-t border-border">
                      <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">المرحلة</p>
                          <p className="font-medium">
                            {gradeLabels[student.grade || ""] || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">المحافظة</p>
                          <p className="font-medium">
                            {student.governorate || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">الكورسات</p>
                          <p className="font-medium">
                            {student.enrolled_courses.length} كورس
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">الحالة</p>
                          <p
                            className={`font-medium ${student.is_active ? "text-chart-3" : "text-destructive"}`}
                          >
                            {student.is_active ? "نشط" : "موقوف"}
                          </p>
                        </div>
                      </div>
                      {/* تقدم الطالب في الكورسات */}
                      {student.enrolled_courses.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-xs font-bold text-muted-foreground">
                            تقدم الطالب
                          </p>
                          {student.enrolled_courses.map((courseId: string) => {
                            const key = `${student.id}_${courseId}`;
                            const p = studentProgress[key];
                            const courseName =
                              courseNames[courseId] || courseId;
                            return (
                              <div
                                key={courseId}
                                className="bg-background border border-border rounded-xl p-3"
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <p className="text-xs font-medium text-foreground flex items-center gap-1 truncate max-w-[60%]">
                                    <BookOpen className="w-3 h-3 shrink-0 text-muted-foreground" />
                                    {courseName}
                                  </p>
                                  <span className="text-xs font-bold text-primary">
                                    {p ? `${p.percentage}%` : "—"}
                                  </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                  <div
                                    className="bg-primary h-2 rounded-full transition-all duration-500"
                                    style={{
                                      width: p ? `${p.percentage}%` : "0%",
                                    }}
                                  />
                                </div>
                                {p && (
                                  <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <PlayCircle className="w-3 h-3" />
                                      {p.watched}/{p.total_lectures} محاضرة
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <FileCheck className="w-3 h-3" />
                                      {p.exam_stats?.passed}/
                                      {p.exam_stats?.taken} اختبار
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-orange-300 text-orange-600 hover:bg-orange-50"
                          disabled={loadingAction === `reset-${student.id}`}
                          onClick={() => handleResetDevice(student.id)}
                        >
                          <Smartphone className="w-4 h-4 ml-2" />
                          {loadingAction === `reset-${student.id}`
                            ? "جاري الـ reset..."
                            : "Reset الجهاز"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={loadingAction === `delete-${student.id}`}
                          onClick={() =>
                            handleDeleteStudent(
                              student.id,
                              `${student.first_name} ${student.last_name}`,
                            )
                          }
                        >
                          <Trash2 className="w-4 h-4 ml-2" />
                          {loadingAction === `delete-${student.id}`
                            ? "جاري الحذف..."
                            : "حذف الحساب"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
