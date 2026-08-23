import { api } from './client';

export const sendContactMessage = (data) => api.post('/api/contact', data);
