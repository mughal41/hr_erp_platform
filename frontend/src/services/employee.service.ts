import api from './api';

export const employeeService = {
  getEmployees: (params?: any) => api.get('/hr/employees/', { params }),
  getEmployee: (id: string) => api.get(`/hr/employees/${id}/`),
  createEmployee: (data: any) => api.post('/hr/employees/', data),
  updateEmployee: (id: string, data: any) => api.patch(`/hr/employees/${id}/`, data),
  deleteEmployee: (id: string) => api.delete(`/hr/employees/${id}/`),
  bulkRegistration: (data: any[]) => api.post('/hr/bulk-registration/', data),
  getDepartments: () => api.get('/hr/departments/'),
  getJobTitles: () => api.get('/hr/job-titles/'),
  resetEmployeePassword: (id: string) => api.post(`/hr/employees/${id}/reset-password/`),
};

