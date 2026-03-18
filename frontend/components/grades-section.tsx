import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen } from "lucide-react"

const grades = [
  {
    id: 1,
    title: "الصف الأول الثانوي",
    description: "كورسات وشروحات متكاملة لمنهج أولى ثانوي",
    color: "from-primary to-primary/80",
  },
  {
    id: 2,
    title: "الصف الثاني الثانوي",
    description: "كورسات وشروحات متكاملة لمنهج تانية ثانوي",
    color: "from-secondary to-secondary/80",
  },
  {
    id: 3,
    title: "الصف الثالث الثانوي",
    description: "كورسات وشروحات متكاملة لمنهج تالتة ثانوي",
    color: "from-chart-3 to-chart-3/80",
  },
]

export function GradesSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-balance">
            <span className="text-secondary">السنوات</span>{" "}
            <span className="text-primary">الدراسية</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            اختار سنتك الدراسية وابدأ رحلة التفوق معانا
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {grades.map((grade) => (
            <div 
              key={grade.id}
              className="group relative bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 transition-all hover:shadow-lg"
            >
              {/* Gradient Header */}
              <div className={`h-32 bg-gradient-to-l ${grade.color} flex items-center justify-center`}>
                <BookOpen className="w-16 h-16 text-white/90" />
              </div>
              
              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 text-card-foreground">{grade.title}</h3>
                <p className="text-muted-foreground mb-4">{grade.description}</p>
                <Button 
                  variant="ghost" 
                  asChild 
                  className="group/btn hover:text-primary p-0 h-auto"
                >
                  <Link href={`/courses?grade=${grade.id}`} className="flex items-center gap-2">
                    <span>استعرض الكورسات</span>
                    <ArrowLeft className="w-4 h-4 group-hover/btn:-translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
