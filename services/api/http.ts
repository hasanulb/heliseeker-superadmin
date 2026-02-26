export async function http<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
  });
  const data :any= await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || 'Request failed');
  }
  return data?.data as T;
}

export const api = {
  get: <T>(url: string) => http<T>(url, { method: 'GET' }),
  post: <T>(url: string, body?: any) => http<T>(url, { method: 'POST', body: JSON.stringify(body || {}) }),
  patch: <T>(url: string, body?: any) => http<T>(url, { method: 'PATCH', body: JSON.stringify(body || {}) }),
  delete: <T>(url: string) => http<T>(url, { method: 'DELETE' }),
};
