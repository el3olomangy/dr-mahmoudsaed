const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

// تجديد الـ access token تلقائياً
async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    // حفظ التوكنات الجديدة
    localStorage.setItem("token", data.access_token);
    if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
    return data.access_token;
  } catch {
    return null;
  }
}

// مسح بيانات الجلسة والتحويل للـ login
function clearSessionAndRedirect() {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  document.cookie = "token=; path=/; max-age=0";
  document.cookie = "user_role=; path=/; max-age=0";
  window.location.href = "/login";
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  // لو 401 — جرب تجدد التوكن وأعد الـ request مرة واحدة
  if (res.status === 401) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
      const retryRes = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers: retryHeaders });
      if (!retryRes.ok) {
        const error = await retryRes.json().catch(() => ({ detail: "حصل خطأ" }));
        // لو 401 تاني — انتهت الجلسة خالص
        if (retryRes.status === 401) clearSessionAndRedirect();
        throw new Error(error.detail || "حصل خطأ");
      }
      return retryRes.json();
    } else {
      // مفيش refresh token أو انتهى — امسح الجلسة وروح للـ login
      clearSessionAndRedirect();
      throw new Error("انتهت الجلسة — سجّل دخولك من جديد");
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "حصل خطأ" }));
    throw new Error(error.detail || "حصل خطأ");
  }

  return res.json();
}

// ====== Auth ======
export const authAPI = {
  register: (data: object) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (data: object) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
};

// ====== Courses ======
export const coursesAPI = {
  getAll: () => request("/courses/"),
  getOne: (id: string) => request(`/courses/${id}`),
  create: (data: object) =>
    request("/courses/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: object) =>
    request(`/courses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    request(`/courses/${id}`, { method: "DELETE" }),
  createUnit: (courseId: string, data: object) =>
    request(`/courses/${courseId}/units`, { method: "POST", body: JSON.stringify(data) }),
  deleteUnit: (courseId: string, unitId: string) =>
    request(`/courses/${courseId}/units/${unitId}`, { method: "DELETE" }),
  createLecture: (courseId: string, unitId: string, data: object) =>
    request(`/courses/${courseId}/units/${unitId}/lectures`, { method: "POST", body: JSON.stringify(data) }),
  updateLecture: (courseId: string, unitId: string, lectureId: string, data: object) =>
    request(`/courses/${courseId}/units/${unitId}/lectures/${lectureId}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteLecture: (courseId: string, unitId: string, lectureId: string) =>
    request(`/courses/${courseId}/units/${unitId}/lectures/${lectureId}`, { method: "DELETE" }),
};

// ====== Codes ======
export const codesAPI = {
  generate: (data: object) =>
    request("/codes/generate", { method: "POST", body: JSON.stringify(data) }),
  getAll: () => request("/codes/"),
  activate: (code: string) =>
    request("/codes/activate", { method: "POST", body: JSON.stringify({ code }) }),
  disable: (id: string) =>
    request(`/codes/${id}/disable`, { method: "PATCH" }),
  delete: (id: string) =>
    request(`/codes/${id}`, { method: "DELETE" }),
  revokeFromStudent: (codeId: string, userId: string) =>
    request(`/codes/${codeId}/revoke/${userId}`, { method: "PATCH" }),
};

// ====== Exams ======
export const examsAPI = {
  create: (data: object) =>
    request("/exams/", { method: "POST", body: JSON.stringify(data) }),
  getOne: (id: string) => request(`/exams/${id}`),
  getByCourse: (courseId: string) => request(`/exams/course/${courseId}`),
  submit: (data: object) =>
    request("/exams/submit", { method: "POST", body: JSON.stringify(data) }),
  getMyResult: (examId: string) => request(`/exams/my-result/${examId}`),
  // Essay Review
  getForReview: (examId: string) => request(`/exams/review/${examId}`),
  submitReview: (data: object) =>
    request("/exams/review", { method: "POST", body: JSON.stringify(data) }),
  // Edit / Delete / Full Update
  updateExam: (id: string, data: object) =>
    request(`/exams/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  fullUpdateExam: (id: string, data: object) =>
    request(`/exams/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  getExamForAdmin: (id: string) => request(`/exams/admin/${id}`),
  deleteExam: (id: string) =>
    request(`/exams/${id}`, { method: "DELETE" }),
};

// ====== Notifications ======
export const notificationsAPI = {
  getAll: () => request("/notifications/"),
  getUnreadCount: () => request("/notifications/unread-count"),
  markRead: (id: string) =>
    request(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: () =>
    request("/notifications/read-all", { method: "PATCH" }),
  send: (data: object) =>
    request("/notifications/", { method: "POST", body: JSON.stringify(data) }),
};

// ====== Upload ======
export const uploadAPI = {
  image: async (file: File): Promise<string> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch(`${BASE_URL}/upload/image`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || "فشل رفع الصورة")
    }
    const data = await res.json()
    // حوّل الـ path النسبي لـ URL كامل
    const base = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1").replace("/api/v1", "")
    return data.url.startsWith("http") ? data.url : `${base}${data.url}`
  },
};

// ====== Progress ======
export const progressAPI = {
  markWatched: (lectureId: string) =>
    request(`/progress/lecture/${lectureId}`, { method: "POST" }),
  getCourseProgress: (courseId: string) =>
    request(`/progress/course/${courseId}`),
  getStudentCourseProgress: (studentId: string, courseId: string) =>
    request(`/progress/student/${studentId}/course/${courseId}`),
  savePosition: (lectureId: string, position: number, duration: number) =>
    request(`/progress/lecture/${lectureId}/position`, {
      method: "POST",
      body: JSON.stringify({ position, duration }),
    }),
  getPosition: (lectureId: string) =>
    request(`/progress/lecture/${lectureId}/position`),
};

// ====== Users ======
export const usersAPI = {
  getAll: () => request("/users/"),
  getOne: (id: string) => request(`/users/${id}`),
  getMyProfile: () => request("/users/me/profile"),
  updateProfile: (data: object) =>
    request("/users/me/profile", { method: "PATCH", body: JSON.stringify(data) }),
  toggleActive: (id: string) =>
    request(`/users/${id}/toggle-active`, { method: "PATCH" }),
  resetDevice: (id: string) =>
    request(`/users/${id}/reset-device`, { method: "PATCH" }),
  getByParentPhone: (phone: string) =>
    request(`/users/parent/${phone}`),
  deleteStudent: (id: string) =>
    request(`/users/${id}`, { method: "DELETE" }),
};
// ====== Stats ======
export const statsAPI = {
  getOverview: () => request("/stats/overview"),
  getTopCourses: () => request("/stats/top-courses"),
  getRecentStudents: () => request("/stats/recent-students"),
  getExamStats: (examId: string) => request(`/stats/exam/${examId}`),
};
// ====== Assignments ======
export const assignmentsAPI = {
  create: (data: object) =>
    request("/assignments/", { method: "POST", body: JSON.stringify(data) }),
  getByLecture: (lectureId: string) =>
    request(`/assignments/lecture/${lectureId}`),
  getByCourse: (courseId: string) =>
    request(`/assignments/course/${courseId}`),
  submit: (data: object) =>
    request("/assignments/submit", { method: "POST", body: JSON.stringify(data) }),
  getSubmissions: (assignmentId: string) =>
    request(`/assignments/${assignmentId}/submissions`),
  gradeSubmission: (submissionId: string, data: object) =>
    request(`/assignments/submissions/${submissionId}/grade`, { method: "PATCH", body: JSON.stringify(data) }),
  getMySubmissions: () =>
    request("/assignments/my-submissions"),
  delete: (id: string) =>
    request(`/assignments/${id}`, { method: "DELETE" }),
  getResults: (examId: string) => request(`/exams/results/${examId}`),
};
