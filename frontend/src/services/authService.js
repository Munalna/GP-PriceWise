import api from './api';

export const authService = {
  // Sign up new user
  signup: async (email, password, businessName) => {
    const response = await api.post('/auth/signup', {
      email,
      password,
      businessName
    });
    return response.data;
  }
};