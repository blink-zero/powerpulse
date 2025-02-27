import api from './api';

export const getNutServers = () => api.get('/nut/servers');
export const getNutServer = (id) => api.get(`/nut/servers/${id}`);
export const addNutServer = (data) => api.post('/nut/servers', data);
export const updateNutServer = (id, data) => api.put(`/nut/servers/${id}`, data);
export const deleteNutServer = (id) => api.delete(`/nut/servers/${id}`);
export const testNutServerConnection = (id) => api.post(`/nut/servers/${id}/test`);
