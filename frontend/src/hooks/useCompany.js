import { useState, useEffect, useRef, useCallback } from 'react';
import { getCompanyProblems, getCompanyStats } from '../api/company';
import { upsertProgress } from '../api/progress';
import { toggleBookmark as apiToggleBookmark } from '../api/bookmarks';

export function useCompany(slug, initialParams = {}) {
  const [period, setPeriod] = useState(initialParams.period || 'all');
  const [difficulty, setDifficulty] = useState(initialParams.difficulty || '');
  const [sortBy, setSortBy] = useState(initialParams.sortBy || 'frequency');
  const [page, setPage] = useState(initialParams.page || 1);

  const [companyInfo, setCompanyInfo] = useState(null);
  const [stats, setStats] = useState({});
  const [problems, setProblems] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);

  const tabCache = useRef({});

  // Fetch stats once
  useEffect(() => {
    async function loadStats() {
      try {
        const res = await getCompanyStats(slug);
        setCompanyInfo(res.company);
        setStats(res.stats || {});
      } catch (err) {
        console.error('Failed to load company stats:', err);
      } finally {
        setStatsLoading(false);
      }
    }
    loadStats();
  }, [slug]);

  // Fetch problems
  useEffect(() => {
    const cacheKey = `${period}_${difficulty}_${sortBy}_${page}`;
    if (tabCache.current[cacheKey]) {
      const cached = tabCache.current[cacheKey];
      setProblems(cached.problems);
      setPagination(cached.pagination);
      setLoading(false);
      return;
    }

    async function loadProblems() {
      setLoading(true);
      setError(null);
      try {
        const res = await getCompanyProblems(slug, {
          period,
          difficulty: difficulty || undefined,
          sortBy,
          page,
          limit: 50,
        });

        const fetchedProblems = res.questions || res.problems || [];
        const fetchedPagination = res.pagination || {};

        tabCache.current[cacheKey] = {
          problems: fetchedProblems,
          pagination: fetchedPagination,
        };

        if (res.company) setCompanyInfo(res.company);
        setProblems(fetchedProblems);
        setPagination(fetchedPagination);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadProblems();
  }, [slug, period, difficulty, sortBy, page]);

  const updateStatus = useCallback(async (questionId, newStatus) => {
    setProblems(prev => prev.map(p => p.id === questionId ? { ...p, status: newStatus } : p));
    try {
      await upsertProgress({ questionId, status: newStatus });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  }, []);

  const toggleBookmark = useCallback(async (questionId) => {
    setProblems(prev => prev.map(p => p.id === questionId ? { ...p, bookmarked: !p.bookmarked } : p));
    try {
      await apiToggleBookmark(questionId);
    } catch (err) {
      setProblems(prev => prev.map(p => p.id === questionId ? { ...p, bookmarked: !p.bookmarked } : p));
    }
  }, []);

  return {
    companyInfo,
    stats,
    problems,
    pagination,
    loading,
    statsLoading,
    error,
    period,
    setPeriod,
    difficulty,
    setDifficulty,
    sortBy,
    setSortBy,
    page,
    setPage,
    updateStatus,
    toggleBookmark,
  };
}
