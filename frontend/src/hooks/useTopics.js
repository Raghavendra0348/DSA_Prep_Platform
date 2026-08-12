import { useState, useEffect } from 'react';
import { getTopics } from '../api/topics';

export function useTopics() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await getTopics();
        setTopics(data.topics || data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredTopics = topics.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return {
    topics: filteredTopics,
    rawCount: topics.length,
    loading,
    error,
    search,
    setSearch,
  };
}
