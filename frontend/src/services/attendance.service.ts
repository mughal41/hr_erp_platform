import api from './api';

export const attendanceService = {
  getAttendance: () => api.get('/attendance/records/'),
  getAnalytics: () => api.get('/attendance/records/analytics/'),
  clockIn: (data: any) => api.post('/attendance/records/clock_in/', data),
  clockOut: (data: any) => api.post('/attendance/records/clock_out/', data),

  // Attendance Requests
  getAttendanceRequests: () => api.get('/attendance/requests/'),
  createAttendanceRequest: (data: any) => api.post('/attendance/requests/', data),
  approveAttendanceRequest: (id: string, data: any = {}) => api.post(`/attendance/requests/${id}/approve/`, data),
  rejectAttendanceRequest: (id: string, data: any = {}) => api.post(`/attendance/requests/${id}/reject/`, data),
};

