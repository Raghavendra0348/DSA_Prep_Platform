import { api } from './client';

export function getBookmarks(params = {}) {
  const query = new URLSearchParams();
  if (params.page)  query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);

  const qs = query.toString();
  return api.get(`/api/bookmarks${qs ? `?${qs}` : ''}`);
}

export const toggleBookmark = (questionId) => api.post('/api/bookmarks', { questionId });
