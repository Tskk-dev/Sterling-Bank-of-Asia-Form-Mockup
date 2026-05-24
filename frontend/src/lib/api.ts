// src/lib/api.ts
const BASE = 'http://localhost:3001/api';

async function req(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

// Auth
export const loginUser = (username: string, password: string) =>
  req('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });

// Applications
export const getApplications   = ()              => req('/applications');
export const getApplication    = (id: string)    => req(`/applications/${id}`);
export const createApplication = (data: any)     => req('/applications', { method: 'POST', body: JSON.stringify(data) });
export const updateApplication = (id: string, data: any) => req(`/applications/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteApplication = (id: string)    => req(`/applications/${id}`, { method: 'DELETE' });

// Stats
export const getStats = () => req('/stats');
