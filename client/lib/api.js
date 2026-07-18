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
  activeSessions: () => request('/interview/active'),
};

export const interview = {
  options: () => request('/interview/options'),

  status: (sessionId) => {
    const params = sessionId ? `?sessionId=${sessionId}` : '';
    return request(`/interview/status${params}`);
  },

  start: (interviewType, branch) =>
    request('/interview/start', {
      method: 'POST',
      body: JSON.stringify({ interviewType, branch: branch || undefined }),
    }),

  answer: (sessionId, answer) =>
    request('/interview/answer', {
      method: 'POST',
      body: JSON.stringify({ sessionId, answer }),
    }),

  end: (sessionId) =>
    request('/interview/end', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),

  refresh: (interviewType, branch) =>
    request('/interview/refresh', {
      method: 'POST',
      body: JSON.stringify({ interviewType, branch: branch || undefined }),
    }),
};
