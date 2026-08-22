import { api } from './client';

export const getCompanies    = () => api.get('/api/companies');
export const getCompanySlugs = () => api.get('/api/companies/slugs');
export const getFeaturedCompanies = (slugs) =>
  api.get(`/api/companies/featured?slugs=${slugs.join(',')}`);
