import { api } from './client';

export const getTopics = () => api.get('/api/topics');

export function getTopicProblems(topic, params = {}) {
  const query = new URLSearchParams();
  if (params.difficulty) query.set('difficulty', params.difficulty);
  if (params.page)       query.set('page', params.page);
  if (params.limit)      query.set('limit', params.limit);

  const qs = query.toString();
  return api.get(`/api/topics/${topic}${qs ? `?${qs}` : ''}`);
}
