import api from './api';

export const leaveService = {
  getLeaveRequests: () => api.get('/leave/requests/'),
  getLeaveBalances: () => api.get('/leave/balances/'),
  createLeaveRequest: (data: any) => api.post('/leave/requests/', data),
  approveLeaveRequest: (id: string) => api.post(`/leave/requests/${id}/approve/`),
  rejectLeaveRequest: (id: string) => api.post(`/leave/requests/${id}/reject/`),
};
