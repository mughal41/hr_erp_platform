import api from './api';

export const attendanceService = {
  getAttendance: () => api.get('/attendance/records/'),
  getAnalytics: () => api.get('/attendance/records/analytics/'),
  clockIn: (data: any) => api.post('/attendance/records/clock_in/', data),
  clockOut: (data: any) => api.post('/attendance/records/clock_out/', data),
};
