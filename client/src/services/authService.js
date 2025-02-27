import api from './api';

export const login = (username, password) => 
  api.post('/auth/login', { username, password });

export const register = (userData) => 
  api.post('/auth/register', userData);

export const checkSetup = () => 
  api.get('/auth/check-setup');

export const setup = (setupData) => 
  api.post('/auth/setup', setupData);

export const changePassword = (currentPassword, newPassword) => 
  api.post('/auth/change-password', { currentPassword, newPassword });

export const getUsers = () => 
  api.get('/users');
