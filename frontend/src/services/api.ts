import type { AppStateData } from '@/types/app';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface ApiStateResponse {
  ok: boolean;
  message?: string | null;
  entityId?: string | null;
  state: AppStateData;
}

export async function apiRequest<TBody = unknown>(
  path: string,
  options: Omit<RequestInit, 'body'> & { body?: TBody } = {},
): Promise<ApiStateResponse> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json();
  if (!response.ok) {
    const detail = typeof data?.detail === 'string' ? data.detail : 'Request failed';
    throw new Error(detail);
  }
  return data as ApiStateResponse;
}
