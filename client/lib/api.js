const API_BASE = '/api';

const REQUEST_TIMEOUT_MS = 30000;

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(url, { ...config, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new ApiError('Request timed out. The AI took too long to respond, please try again.', 408);
    }
    throw new ApiError(error?.message || 'Network error. Please try again.');
  } finally {
    clearTimeout(timeout);
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    throw new ApiError('Received an invalid response from the server. Please try again.', response.status || 502);
  }

  if (!response.ok) {
    throw new ApiError(data.message || 'Request failed', response.status);
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
};

export const interview = {
  options: () => request('/interview/options'),

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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    return fetch(url, {
      method: 'POST',
      credentials: 'include',
      signal: controller.signal,
      body: formData,
    }).then(async (response) => {
      clearTimeout(timeout);
      let data;
      try {
        data = await response.json();
      } catch (error) {
        throw new ApiError('Received an invalid response from the server. Please try again.', response.status || 502);
      }
      if (!response.ok) {
        throw new ApiError(data.message || 'Request failed', response.status);
      }
      return data;
    }).catch((error) => {
      clearTimeout(timeout);
      if (error?.name === 'AbortError') {
        throw new ApiError('Request timed out. The AI took too long to respond, please try again.', 408);
      }
      throw error;
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

  delete: (sessionId) =>
    request(`/interview/${sessionId}`, {
      method: 'DELETE',
    }),

  retake: (sessionId) =>
    request(`/interview/${sessionId}/retake`, {
      method: 'POST',
    }),
};

export const leaderboard = {
  list: (limit) =>
    request(`/interview/leaderboard${limit ? `?limit=${limit}` : ''}`),
};
