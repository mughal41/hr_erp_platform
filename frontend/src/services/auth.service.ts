import api from './api';

export const authService = {
  changePassword: (data: any) => api.post('/auth/users/change-password/', data),
};
