import api from './api';

export const recruitmentService = {
  getJobRequisitions: () => api.get('/recruitment/job-requisitions/'),
  getCandidates: () => api.get('/recruitment/candidates/'),
  getApplications: () => api.get('/recruitment/applications/'),
  createJobRequisition: (data: any) => api.post('/recruitment/job-requisitions/', data),
};
