import { api } from './client';

export function search(q, type = 'all', difficulty, limit = 20) {
  const query = new URLSearchParams({ q, type });
  if (difficulty) query.set('difficulty', difficulty);
  if (limit)      query.set('limit', limit);
  return api.get(`/api/search?${query}`);
}
