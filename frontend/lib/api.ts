const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
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

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

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
  createLecture: (courseId: string, unitId: string, data: object) =>
    request(`/courses/${courseId}/units/${unitId}/lectures`, { method: "POST", body: JSON.stringify(data) }),
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
};

// ====== Notifications ======
export const notificationsAPI = {
  getAll: () => request("/notifications/"),
  getUnreadCount: () => request("/notifications/unread-count"),
  markRead: (id: string) =>
    request(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: () =>
    request("/notifications/read-all", { method: "PATCH" }),
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