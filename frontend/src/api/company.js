import { api } from './client';

export function getCompanyProblems(slug, params = {}) {
  const query = new URLSearchParams();
  if (params.period)     query.set('period', params.period);
  if (params.difficulty) query.set('difficulty', params.difficulty);
  if (params.topics)     query.set('topics', params.topics);
  if (params.sortBy)     query.set('sortBy', params.sortBy);
  if (params.page)       query.set('page', params.page);
  if (params.limit)      query.set('limit', params.limit);

  const qs = query.toString();
  return api.get(`/api/company/${slug}${qs ? `?${qs}` : ''}`);
}

export const getCompanyStats = (slug) => api.get(`/api/company/${slug}/stats`);
