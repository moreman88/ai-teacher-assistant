import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/me', data),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// Tasks
export const tasksAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getOne: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.patch(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

// Groups
export const groupsAPI = {
  getAll: () => api.get('/groups'),
  getOne: (id) => api.get(`/groups/${id}`),
  create: (data) => api.post('/groups', data),
  update: (id, data) => api.patch(`/groups/${id}`, data),
  delete: (id) => api.delete(`/groups/${id}`),
};

// Students
export const studentsAPI = {
  getOne: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  createBulk: (data) => api.post('/students/bulk', data),
  update: (id, data) => api.patch(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
};

// Assessments
export const assessmentsAPI = {
  getByTask: (taskId) => api.get(`/assessments/task/${taskId}`),
  getByStudent: (studentId) => api.get(`/assessments/student/${studentId}`),
  getJournal: (groupId) => api.get(`/assessments/journal/${groupId}`),
  create: (data) => api.post('/assessments', data),
  createBulk: (data) => api.post('/assessments/bulk', data),
  delete: (id) => api.delete(`/assessments/${id}`),
};

// AI
export const aiAPI = {
  getSubjects: () => api.get('/ai/subjects'),
  getUsage: () => api.get('/ai/usage'),
  generateTask: (data) => api.post('/ai/generate-task', data),
  saveTask: (data) => api.post('/ai/save-task', data),
  evaluate: (data) => api.post('/ai/evaluate', data),
  getHistory: (params) => api.get('/ai/history', { params }),
};

// Admin
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getAIReport: (days) => api.get('/admin/ai-report', { params: { days } }),
};

export default api;
