import api from './api';

export const leaveService = {
  getLeaveRequests: () => api.get('/leave/requests/'),
  getLeaveBalances: () => api.get('/leave/balances/'),
  createLeaveRequest: (data: any) => api.post('/leave/requests/', data),
  updateLeaveRequest: (id: string, data: any) => api.patch(`/leave/requests/${id}/`, data),
  deleteLeaveRequest: (id: string) => api.delete(`/leave/requests/${id}/`),
  approveLeaveRequest: (id: string) => api.post(`/leave/requests/${id}/approve/`),
  rejectLeaveRequest: (id: string) => api.post(`/leave/requests/${id}/reject/`),
  getLeaveTypes: () => api.get('/leave/types/'),
  bulkUpdateQuota: (id: string, quota: number) => api.post(`/leave/types/${id}/bulk-update-quota/`, { annual_quota: quota }),
};
