import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KeyRound, PlayCircle, BookOpen } from "lucide-react"

// Mock data
const myCourses = [
  {
    id: 1,
    title: "الكيمياء العضوية",
    description: "شرح شامل للكيمياء العضوية للصف الثالث الثانوي",
    thumbnail: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=300&fit=crop",
    progress: 65,
    totalLectures: 24,
    completedLectures: 16,
    isSubscribed: true,
  },
  {
    id: 2,
    title: "الفيزياء الحديثة",
    description: "الفيزياء الحديثة وميكانيكا الكم للثانوية العامة",
    thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop",
    progress: 40,
    totalLectures: 18,
    completedLectures: 7,
    isSubscribed: true,
  },
]

const availableCourses = [
  {
    id: 3,
    title: "الأحياء - الوراثة",
    description: "الوراثة والهندسة الوراثية للثانوية العامة",
    thumbnail: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop",
    totalLectures: 20,
    isSubscribed: false,
  },
  {
    id: 4,
    title: "الكيمياء الكهربائية",
    description: "الخلايا الكهربائية والتحليل الكهربائي",
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
    totalLectures: 15,
    isSubscribed: false,
  },
]

function CourseCard({ course }: { course: typeof myCourses[0] | typeof availableCourses[0] }) {
  const isSubscribed = 'isSubscribed' in course && course.isSubscribed

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative aspect-video">
        <Image 
          src={course.thumbnail}
          alt={course.title}
          fill
          className="object-cover"
        />
        {!isSubscribed && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-primary text-white px-4 py-2 rounded-full text-sm font-bold">
              غير مشترك
            </span>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-bold text-lg text-foreground mb-1">{course.title}</h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{course.description}</p>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <PlayCircle className="w-4 h-4" />
            {course.totalLectures} محاضرة
          </span>
        </div>

        {isSubscribed && 'progress' in course ? (
          <>
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">
                  {course.completedLectures} من {course.totalLectures} محاضرة
                </span>
                <span className="font-bold text-primary">{course.progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${course.progress}%` }}
                />
              </div>
            </div>
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href={`/dashboard/courses/${course.id}`}>
                <BookOpen className="w-4 h-4 ml-2" />
                متابعة الكورس
              </Link>
            </Button>
          </>
        ) : (
          <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-white">
            <Link href="/dashboard/activate">
              <KeyRound className="w-4 h-4 ml-2" />
              ادخل كود الاشتراك
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default function CoursesPage() {
  return (
    <div className="space-y-8">
      {/* My Courses */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">كورساتي</CardTitle>
          </CardHeader>
          <CardContent>
            {myCourses.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">مش مشترك في أي كورس لسه</p>
                <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link href="/dashboard/activate">
                    <KeyRound className="w-4 h-4 ml-2" />
                    فعّل كود الاشتراك
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Available Courses */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">كورسات متاحة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
