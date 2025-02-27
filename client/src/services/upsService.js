import api from './api';

export const getUpsSystems = () => api.get('/ups/systems');
export const getUpsSystem = (id) => api.get(`/ups/systems/${id}`);
export const addUpsSystem = (data) => api.post('/ups/systems', data);
export const updateUpsSystem = (id, data) => api.put(`/ups/systems/${id}`, data);
export const deleteUpsSystem = (id) => api.delete(`/ups/systems/${id}`);
export const getBatteryHistory = (id) => api.get(`/ups/${id}/battery-history`);
