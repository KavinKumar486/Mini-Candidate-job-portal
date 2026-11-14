const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error?.message || 'Request failed');
    this.status = status;
    this.body = body;
    this.code = body?.error?.code;
    this.details = body?.error?.details;
  }
}

export async function api(path, { method = 'GET', body, token, headers: extra } = {}) {
  const headers = { ...(extra || {}) };
  const accessToken = token ?? localStorage.getItem('accessToken');
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  let payload = body;
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, { method, headers, body: payload });
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json() : null;
  if (res.status === 401 && !path.startsWith('/api/auth/login')) {
    localStorage.removeItem('accessToken');
    window.dispatchEvent(new Event('auth:logout'));
  }
  if (!res.ok) {
    throw new ApiError(res.status, data);
  }
  return data;
}

export function apiUrl(path) {
  return `${BASE}${path}`;
}
