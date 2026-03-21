// ============================================================
// lib/api.ts — كل الـ API calls بتاعت المنصة
// الـ Base URL بتاخده من .env.local
// ============================================================

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

async function request(
  endpoint: string,
  options: RequestInit = {},
  isFormData = false
) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null

  const headers: Record<string, string> = {}

  if (!isFormData) {
    headers["Content-Type"] = "application/json"
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string>),
    },
  })

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      localStorage.removeItem("refresh_token")
      localStorage.removeItem("user")
      document.cookie = "token=; path=/; max-age=0"
      document.cookie = "user_role=; path=/; max-age=0"
      window.location.href = "/login"
    }
    throw new Error("غير مصرح")
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || "حصل خطأ في السيرفر")
  }

  const text = await res.text()
  if (!text) return {}
  return JSON.parse(text)
}

// ============================================================
// AUTH
// ============================================================

export const authAPI = {
  register: (data: {
    first_name: string
    last_name: string
    phone: string
    parent_phone: string
    password: string
    grade?: string
    governorate?: string
    gender?: string
  }) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { phone: string; password: string; device_id: string }) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: (refresh_token: string) =>
    request("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token }),
    }),

  me: () => request("/auth/me"),

  refresh: (refresh_token: string) =>
    request("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token }),
    }),

  changePassword: (data: { old_password: string; new_password: string }) =>
    request("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

// ============================================================
// COURSES
// ============================================================

export const coursesAPI = {
  getAll: () => request("/courses/"),

  getOne: (courseId: string) => request(`/courses/${courseId}`),

  create: (data: {
    title: string
    description?: string
    grade: string
    price?: number
    thumbnail?: string
  }) =>
    request("/courses/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    courseId: string,
    data: {
      title: string
      description?: string
      grade: string
      price?: number
      thumbnail?: string
    }
  ) =>
    request(`/courses/${courseId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (courseId: string) =>
    request(`/courses/${courseId}`, { method: "DELETE" }),

  createUnit: (courseId: string, data: { title: string; order: number }) =>
    request(`/courses/${courseId}/units`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteUnit: (courseId: string, unitId: string) =>
    request(`/courses/${courseId}/units/${unitId}`, { method: "DELETE" }),

  createLecture: (
    courseId: string,
    unitId: string,
    data: {
      title: string
      description?: string
      video_url?: string
      pdf_url?: string
      order: number
      lecture_type: string
      duration_minutes?: number
    }
  ) =>
    request(`/courses/${courseId}/units/${unitId}/lectures`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateLecture: (
    courseId: string,
    unitId: string,
    lectureId: string,
    data: {
      title?: string
      description?: string
      video_url?: string
      pdf_url?: string
      order?: number
      lecture_type?: string
      duration_minutes?: number
    }
  ) =>
    request(`/courses/${courseId}/units/${unitId}/lectures/${lectureId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteLecture: (courseId: string, unitId: string, lectureId: string) =>
    request(`/courses/${courseId}/units/${unitId}/lectures/${lectureId}`, {
      method: "DELETE",
    }),
}

// ============================================================
// CODES
// ============================================================

export const codesAPI = {
  getAll: () => request("/codes/"),

  generate: (data: {
    quantity: number
    code_type: "course" | "bundle"
    course_id?: string
    bundle_ids?: string[]
    expires_days?: number
  }) =>
    request("/codes/generate", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  activate: (code: string) =>
    request("/codes/activate", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  disable: (codeId: string) =>
    request(`/codes/${codeId}/disable`, { method: "PATCH" }),

  delete: (codeId: string) =>
    request(`/codes/${codeId}`, { method: "DELETE" }),

  revoke: (codeId: string, userId: string) =>
    request(`/codes/${codeId}/revoke/${userId}`, { method: "PATCH" }),
}

// ============================================================
// EXAMS
// ============================================================

export const examsAPI = {
  getByCourse: (courseId: string) => request(`/exams/course/${courseId}`),

  getOne: (examId: string) => request(`/exams/${examId}`),

  getExamForAdmin: (examId: string) => request(`/exams/${examId}/admin`),

  create: (data: {
    title: string
    course_id: string
    lecture_id?: string
    pass_score: number
    duration_minutes?: number
    is_homework?: boolean
    deadline?: string
    questions: {
      text: string
      question_type: "mcq" | "essay"
      points: number
      choices?: { text: string; is_correct: boolean }[]
    }[]
  }) =>
    request("/exams/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  fullUpdateExam: (examId: string, data: object) =>
    request(`/exams/${examId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteExam: (examId: string) =>
    request(`/exams/${examId}`, { method: "DELETE" }),

  submit: (data: {
    exam_id: string
    answers: {
      question_id: string
      selected_choice?: string
      essay_answer?: string
    }[]
  }) =>
    request("/exams/submit", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMyResult: (examId: string) => request(`/exams/${examId}/my-result`),

  getResults: (examId: string) => request(`/exams/${examId}/results`),

  submitReview: (
    resultId: string,
    data: { question_id: string; points: number }[]
  ) =>
    request(`/exams/results/${resultId}/review`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
}

// ============================================================
// USERS
// ============================================================

export const usersAPI = {
  getMyProfile: () => request("/users/me/profile"),

  updateProfile: (data: {
    first_name?: string
    last_name?: string
    governorate?: string | null
  }) =>
    request("/users/me/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getAll: (params?: { grade?: string; search?: string }) => {
    const query = new URLSearchParams()
    if (params?.grade) query.append("grade", params.grade)
    if (params?.search) query.append("search", params.search)
    const qs = query.toString()
    return request(`/users/${qs ? "?" + qs : ""}`)
  },

  toggleActive: (userId: string) =>
    request(`/users/${userId}/toggle-active`, { method: "PATCH" }),

  deleteStudent: (userId: string) =>
    request(`/users/${userId}`, { method: "DELETE" }),

  resetDevice: (userId: string) =>
    request(`/users/${userId}/reset-device`, { method: "PATCH" }),

  resetPassword: (userId: string, newPassword: string) =>
    request(`/users/${userId}/reset-password`, {
      method: "PATCH",
      body: JSON.stringify({ new_password: newPassword }),
    }),

  forceLogout: (userId: string) =>
    request(`/users/${userId}/force-logout`, { method: "POST" }),
}

// ============================================================
// PROGRESS
// ============================================================

export const progressAPI = {
  savePosition: (lectureId: string, position: number, duration: number) =>
    request(`/progress/lecture/${lectureId}/position`, {
      method: "POST",
      body: JSON.stringify({ position, duration }),
    }),

  getPosition: (lectureId: string) =>
    request(`/progress/lecture/${lectureId}/position`),

  getCourseProgress: (courseId: string) =>
    request(`/progress/course/${courseId}`),

  getStudentCourseProgress: (studentId: string, courseId: string) =>
    request(`/progress/student/${studentId}/course/${courseId}`),
}

// ============================================================
// STATS
// ============================================================

export const statsAPI = {
  getOverview: () => request("/stats/overview"),

  getTopCourses: () => request("/stats/top-courses"),

  getRecentStudents: () => request("/stats/recent-students"),
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export const notificationsAPI = {
  getAll: () => request("/notifications/"),

  getUnreadCount: () => request("/notifications/unread-count"),

  markRead: (notificationId: string) =>
    request(`/notifications/${notificationId}/read`, { method: "PATCH" }),

  markAllRead: () => request("/notifications/read-all", { method: "PATCH" }),

  send: (data: {
    title: string
    body: string
    notification_type: string
    target_grade?: string
    target_user_id?: string
  }) =>
    request("/notifications/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

// ============================================================
// ASSIGNMENTS
// ============================================================

export const assignmentsAPI = {
  getByLecture: (lectureId: string) =>
    request(`/assignments/lecture/${lectureId}`),

  getByCourse: (courseId: string) =>
    request(`/assignments/course/${courseId}`),

  getMySubmissions: () => request("/assignments/my-submissions"),

  getSubmissions: (assignmentId: string) =>
    request(`/assignments/${assignmentId}/submissions`),

  submit: (data: { assignment_id: string; text_answer: string }) =>
    request("/assignments/submit", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  grade: (submissionId: string, data: { grade: number; teacher_note?: string }) =>
    request(`/assignments/submissions/${submissionId}/grade`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  create: (data: {
    title: string
    description: string
    lecture_id: string
    course_id: string
    deadline?: string
  }) =>
    request("/assignments/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  delete: (assignmentId: string) =>
    request(`/assignments/${assignmentId}`, { method: "DELETE" }),
}

// ============================================================
// UPLOAD
// ============================================================

export const uploadAPI = {
  image: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData()
    formData.append("file", file)

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null

    const res = await fetch(`${BASE_URL}/upload/image`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || "فشل رفع الصورة")
    }

    return res.json()
  },
}

// ============================================================
// GRADE IMAGES — صور المراحل الدراسية
// ============================================================

export const gradeImagesAPI = {
  getAll: () => request("/grade-images/"),

  update: (grade: string, imageUrl: string) =>
    request(`/grade-images/${grade}`, {
      method: "PATCH",
      body: JSON.stringify({ image_url: imageUrl }),
    }),
}