const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export const auth = {
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (username, password) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  me: () => request('/auth/me'),
};

export const dashboard = {
  summary: () => request('/dashboard/summary'),
  sessions: () => request('/interview/sessions'),
};

export const interview = {
  options: () => request('/interview/options'),

  status: (sessionId) => {
    const params = sessionId ? `?sessionId=${sessionId}` : '';
    return request(`/interview/status${params}`);
  },

  details: (sessionId) => request(`/interview/${sessionId}`),

  history: () => request('/interview/history'),

  start: (interviewType, branch, questionLimit) =>
    request('/interview/start', {
      method: 'POST',
      body: JSON.stringify({ interviewType, branch: branch || undefined, questionLimit }),
    }),

  startResume: (file, questionLimit) => {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('questionLimit', questionLimit);
    const url = `${API_BASE}/interview/start-resume`;
    return fetch(url, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }
      return data;
    });
  },

  answer: (sessionId, answer) =>
    request('/interview/answer', {
      method: 'POST',
      body: JSON.stringify({ sessionId, answer }),
    }),
  pause: (sessionId) => request(`/interview/${sessionId}/pause`, { method: 'POST' }),
  resume: (sessionId) => request(`/interview/${sessionId}/resume`, { method: 'POST' }),
  end: (sessionId) => request(`/interview/${sessionId}/end`, { method: 'POST' }),

  sessions: () => request('/interview/sessions'),

  delete: (sessionId) =>
    request(`/interview/${sessionId}`, {
      method: 'DELETE',
    }),
};

export const leaderboard = {
  list: (limit) =>
    request(`/interview/leaderboard${limit ? `?limit=${limit}` : ''}`),
};
