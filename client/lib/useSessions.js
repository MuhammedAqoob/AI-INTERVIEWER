'use client';

import { useCallback, useState } from 'react';
import { interview } from './api';

export function useSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await interview.history();
      setSessions(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load history.');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(
    async (id) => {
      setDeletingId(id);
      try {
        await interview.delete(id);
        setSessions((prev) => prev.filter((s) => (s.id || s.sessionId) !== id));
        return true;
      } catch (err) {
        setError(err.message || 'Failed to delete session.');
        return false;
      } finally {
        setDeletingId(null);
      }
    },
    []
  );

  return { sessions, loading, error, deletingId, load, remove, setError };
}
