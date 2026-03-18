import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { 
  PlayCircle, 
  FileText, 
  FileCheck, 
  ClipboardList, 
  Lock, 
  CheckCircle,
  Clock,
  ArrowRight
} from "lucide-react"

// Mock course data
const courseData = {
  id: 1,
  title: "الكيمياء العضوية",
  description: "شرح شامل ومفصل للكيمياء العضوية للصف الثالث الثانوي. الكورس يغطي جميع فصول المنهج مع تمارين وأسئلة امتحانات سابقة.",
  thumbnail: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=400&fit=crop",
  instructor: "د. محمود سعيد",
  lastUpdated: "مارس 2026",
  totalLectures: 24,
  totalDuration: "12 ساعة",
  isSubscribed: true,
  units: [
    {
      id: 1,
      title: "الوحدة الأولى: مقدمة في الكيمياء العضوية",
      lectures: [
        { id: 1, title: "مقدمة وأساسيات", type: "video", duration: "45 دقيقة", isCompleted: true, isLocked: false },
        { id: 2, title: "تصنيف المركبات العضوية", type: "video", duration: "38 دقيقة", isCompleted: true, isLocked: false },
        { id: 3, title: "ملف شرح الوحدة الأولى", type: "pdf", isCompleted: true, isLocked: false },
        { id: 4, title: "اختبار الوحدة الأولى", type: "exam", questions: 15, isCompleted: true, isLocked: false },
      ],
    },
    {
      id: 2,
      title: "الوحدة الثانية: الهيدروكربونات",
      lectures: [
        { id: 5, title: "الألكانات", type: "video", duration: "52 دقيقة", isCompleted: true, isLocked: false },
        { id: 6, title: "الألكينات والألكاينات", type: "video", duration: "48 دقيقة", isCompleted: false, isLocked: false },
        { id: 7, title: "ملف شرح الهيدروكربونات", type: "pdf", isCompleted: false, isLocked: false },
        { id: 8, title: "شيت تدريبات الهيدروكربونات", type: "assignment", isCompleted: false, isLocked: false },
        { id: 9, title: "اختبار الوحدة الثانية", type: "exam", questions: 20, isCompleted: false, isLocked: false },
      ],
    },
    {
      id: 3,
      title: "الوحدة الثالثة: الألدهيدات والكيتونات",
      lectures: [
        { id: 10, title: "مقدمة في الألدهيدات", type: "video", duration: "40 دقيقة", isCompleted: false, isLocked: false },
        { id: 11, title: "الكيتونات وخواصها", type: "video", duration: "45 دقيقة", isCompleted: false, isLocked: false },
        { id: 12, title: "ملف شرح الوحدة الثالثة", type: "pdf", isCompleted: false, isLocked: true },
        { id: 13, title: "اختبار الوحدة الثالثة", type: "exam", questions: 18, isCompleted: false, isLocked: true },
      ],
    },
  ],
}

function getLectureIcon(type: string, isCompleted: boolean, isLocked: boolean) {
  if (isLocked) return <Lock className="w-5 h-5 text-muted-foreground" />
  if (isCompleted) return <CheckCircle className="w-5 h-5 text-chart-3" />
  
  switch (type) {
    case "video":
      return <PlayCircle className="w-5 h-5 text-primary" />
    case "pdf":
      return <FileText className="w-5 h-5 text-secondary" />
    case "exam":
      return <FileCheck className="w-5 h-5 text-chart-4" />
    case "assignment":
      return <ClipboardList className="w-5 h-5 text-chart-3" />
    default:
      return <PlayCircle className="w-5 h-5" />
  }
}

function getLectureHref(lectureId: number, type: string) {
  switch (type) {
    case "video":
      return `/dashboard/watch/${lectureId}`
    case "pdf":
      return `/dashboard/pdf/${lectureId}`
    case "exam":
      return `/dashboard/exam/${lectureId}`
    case "assignment":
      return `/dashboard/assignment/${lectureId}`
    default:
      return "#"
  }
}

export default function CourseDetailsPage() {
  const completedLectures = courseData.units.flatMap(u => u.lectures).filter(l => l.isCompleted).length
  const totalLectures = courseData.units.flatMap(u => u.lectures).length
  const progress = Math.round((completedLectures / totalLectures) * 100)

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link 
        href="/dashboard/courses" 
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        <span>العودة للكورسات</span>
      </Link>

      {/* Course Header */}
      <Card className="overflow-hidden">
        <div className="relative aspect-[3/1]">
          <Image 
            src={courseData.thumbnail}
            alt={courseData.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-0 right-0 left-0 p-6 text-white">
            <h1 className="text-2xl md:text-3xl font-extrabold mb-2">{courseData.title}</h1>
            <p className="text-white/80 text-sm md:text-base max-w-2xl">{courseData.description}</p>
          </div>
        </div>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <PlayCircle className="w-4 h-4" />
              {courseData.totalLectures} محاضرة
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {courseData.totalDuration}
            </span>
            <span>آخر تحديث: {courseData.lastUpdated}</span>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                أكملت {completedLectures} من {totalLectures} محاضرة
              </span>
              <span className="font-bold text-primary">{progress}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">محتوى الكورس</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Accordion type="multiple" defaultValue={["unit-1", "unit-2"]} className="w-full">
            {courseData.units.map((unit) => (
              <AccordionItem key={unit.id} value={`unit-${unit.id}`} className="border-b border-border">
                <AccordionTrigger className="px-4 md:px-6 py-4 hover:bg-muted/50 hover:no-underline">
                  <div className="flex items-center gap-3 text-right">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {unit.id}
                    </div>
                    <span className="font-bold">{unit.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="divide-y divide-border">
                    {unit.lectures.map((lecture) => (
                      <Link
                        key={lecture.id}
                        href={lecture.isLocked ? "#" : getLectureHref(lecture.id, lecture.type)}
                        className={`flex items-center gap-4 px-4 md:px-6 py-4 hover:bg-muted/50 transition-colors ${lecture.isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex-shrink-0">
                          {getLectureIcon(lecture.type, lecture.isCompleted, lecture.isLocked)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium ${lecture.isCompleted ? 'text-muted-foreground' : 'text-foreground'}`}>
                            {lecture.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            {'duration' in lecture && <span>{lecture.duration}</span>}
                            {'questions' in lecture && <span>{lecture.questions} سؤال</span>}
                          </div>
                        </div>
                        {lecture.isCompleted && (
                          <span className="text-xs text-chart-3 font-medium">مكتمل</span>
                        )}
                      </Link>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
