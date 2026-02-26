async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { message?: string }
    throw new Error(payload.message || "Request failed")
  }

  return (await response.json()) as T
}

export function getApi<T>(url: string): Promise<T> {
  return request<T>(url)
}

export function postApi<T>(url: string, body: unknown): Promise<T> {
  return request<T>(url, { method: "POST", body: JSON.stringify(body) })
}

export function patchApi<T>(url: string, body: unknown): Promise<T> {
  return request<T>(url, { method: "PATCH", body: JSON.stringify(body) })
}
