import api from './api';

export const employeeService = {
  getEmployees: () => api.get('/hr/employees/'),
  getEmployee: (id: string) => api.get(`/hr/employees/${id}/`),
  createEmployee: (data: any) => api.post('/hr/employees/', data),
  updateEmployee: (id: string, data: any) => api.patch(`/hr/employees/${id}/`, data),
  deleteEmployee: (id: string) => api.delete(`/hr/employees/${id}/`),
  bulkRegistration: (data: any[]) => api.post('/hr/bulk-registration/', data),
};
