import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, PlayCircle, FileCheck, ArrowLeft, KeyRound } from "lucide-react"

// Mock data - replace with actual data fetching
const stats = [
  { label: "كورساتي", value: "3", icon: BookOpen, color: "text-primary" },
  { label: "فيديوهات مشاهدة", value: "24", icon: PlayCircle, color: "text-secondary" },
  { label: "اختبارات محلولة", value: "12", icon: FileCheck, color: "text-chart-3" },
]

const recentCourses = [
  {
    id: 1,
    title: "الكيمياء العضوية",
    thumbnail: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=300&fit=crop",
    progress: 65,
    isSubscribed: true,
  },
  {
    id: 2,
    title: "الفيزياء الحديثة",
    thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop",
    progress: 40,
    isSubscribed: true,
  },
  {
    id: 3,
    title: "الأحياء - الوراثة",
    thumbnail: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop",
    progress: 0,
    isSubscribed: false,
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-l from-primary to-primary/80 rounded-2xl p-6 lg:p-8 text-white">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-extrabold mb-2">
              أهلاً بيك يا محمد!
            </h1>
            <p className="text-white/80 mb-4">
              واصل مشوارك في رحلة التفوق معانا
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary" className="bg-white text-primary hover:bg-white/90">
                <Link href="/dashboard/courses">
                  <BookOpen className="w-4 h-4 ml-2" />
                  اشتراكاتك
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-white text-white hover:bg-white/10">
                <Link href="/dashboard/activate">
                  <KeyRound className="w-4 h-4 ml-2" />
                  فعّل كود
                </Link>
              </Button>
            </div>
          </div>
          <div className="hidden md:block">
            <Image 
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/teacher_pic-mGYVNXqSPGIcSjUAjZ1jmoFlCHW4n6.png"
              alt="د. محمود سعيد"
              width={150}
              height={150}
              className="h-32 w-auto"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4 lg:p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl lg:text-3xl font-extrabold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Courses */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold">أحدث الكورسات</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/courses" className="flex items-center gap-1">
              عرض الكل
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentCourses.map((course) => (
              <div 
                key={course.id} 
                className="group bg-muted/50 rounded-xl overflow-hidden border border-border hover:border-primary/30 transition-colors"
              >
                <div className="relative aspect-video">
                  <Image 
                    src={course.thumbnail}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                  {!course.isSubscribed && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-bold">
                        غير مشترك
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-foreground mb-2">{course.title}</h3>
                  
                  {course.isSubscribed ? (
                    <>
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">التقدم</span>
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
                          الدخول على الكورس
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
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
