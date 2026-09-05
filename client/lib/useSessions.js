'use client';

import { useCallback, useState } from 'react';
import { interview } from './api';

export function useSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorStatus, setErrorStatus] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setErrorStatus(null);
    try {
      const res = await interview.history();
      setSessions(res.data || []);
    } catch (err) {
      // Keep the raw message for retry display, but also surface the HTTP
      // status so pages can map 401 to a friendly auth-required state.
      setError(err.message || 'Failed to load history.');
      setErrorStatus(err?.status || null);
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
        setErrorStatus(err?.status || null);
        return false;
      } finally {
        setDeletingId(null);
      }
    },
    []
  );

  return { sessions, loading, error, errorStatus, deletingId, load, remove, setError };
}
