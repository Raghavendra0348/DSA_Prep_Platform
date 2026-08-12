import { api } from './client';

export const getQuestion = (slug) => api.get(`/api/questions/${slug}`);
