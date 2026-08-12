import { api } from './client';

export function getProgress(params = {}) {
  const query = new URLSearchParams();
  if (params.page)   query.set('page', params.page);
  if (params.limit)  query.set('limit', params.limit);
  if (params.status) query.set('status', params.status);

  const qs = query.toString();
  return api.get(`/api/progress${qs ? `?${qs}` : ''}`);
}

export const upsertProgress = (data)        => api.post('/api/progress', data);
export const bulkProgress   = (questionIds)  => api.post('/api/progress/bulk', { questionIds });
export const updateNotes    = (qId, notes)   => api.patch(`/api/progress/${qId}/notes`, { notes });
