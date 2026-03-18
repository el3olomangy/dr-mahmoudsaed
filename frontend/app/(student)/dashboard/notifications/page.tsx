import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, BookOpen, FileCheck, KeyRound, PlayCircle } from "lucide-react"

// Mock notifications data
const notifications = [
  {
    id: 1,
    type: "new_lecture",
    title: "محاضرة جديدة متاحة",
    message: "تم إضافة محاضرة جديدة في كورس الكيمياء العضوية: الألدهيدات والكيتونات",
    time: "منذ ساعتين",
    isRead: false,
    icon: PlayCircle,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
  },
  {
    id: 2,
    type: "exam_result",
    title: "نتيجة اختبار",
    message: "تم تصحيح اختبار الفصل الأول - الفيزياء الحديثة. درجتك: 85%",
    time: "منذ 5 ساعات",
    isRead: false,
    icon: FileCheck,
    iconColor: "text-chart-3",
    iconBg: "bg-chart-3/10",
  },
  {
    id: 3,
    type: "subscription",
    title: "تم تفعيل الكود بنجاح",
    message: "تم تفعيل اشتراكك في كورس الفيزياء الحديثة. يمكنك البدء في المشاهدة الآن",
    time: "أمس",
    isRead: true,
    icon: KeyRound,
    iconColor: "text-secondary",
    iconBg: "bg-secondary/10",
  },
  {
    id: 4,
    type: "announcement",
    title: "إعلان من د. محمود سعيد",
    message: "هيتم إضافة مراجعة نهائية لمنهج الكيمياء الأسبوع الجاي إن شاء الله",
    time: "منذ 3 أيام",
    isRead: true,
    icon: Bell,
    iconColor: "text-chart-4",
    iconBg: "bg-chart-4/10",
  },
  {
    id: 5,
    type: "new_course",
    title: "كورس جديد متاح",
    message: "تم إضافة كورس جديد: الأحياء - الوراثة. اشترك الآن واستفيد",
    time: "منذ أسبوع",
    isRead: true,
    icon: BookOpen,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
  },
]

export default function NotificationsPage() {
  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Bell className="w-5 h-5" />
            الإشعارات
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                {unreadCount} جديد
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`p-4 flex gap-4 hover:bg-muted/50 transition-colors ${!notification.isRead ? 'bg-primary/5' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full ${notification.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <notification.icon className={`w-5 h-5 ${notification.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`font-bold ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {notification.title}
                    </h3>
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                </div>
              </div>
            ))}
          </div>

          {notifications.length === 0 && (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">مفيش إشعارات حالياً</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
