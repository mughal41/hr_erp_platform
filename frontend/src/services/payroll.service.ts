import api from './api';

export const payrollService = {
  getSalaryStructures: () => api.get('/payroll/salary-structures/'),
  getPayslips: () => api.get('/payroll/payslips/'),
  getReimbursements: () => api.get('/payroll/reimbursements/'),
  requestReimbursement: (data: any) => api.post('/payroll/reimbursements/', data),
};
