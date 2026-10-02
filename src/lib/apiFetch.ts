import { getTenantSlug } from './tenant';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

// The storefront's RSC pages fetch catalog data directly (CLAUDE.md section
// 7: "RSC fetching directly... No Redux, no RTK Query") — this is that
// fetch, kept in one place so every server component sends the same
// tenant header and base URL. Public data only: no credentials, so it
// stays cacheable and safe to call from a Server Component.
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'x-tenant-slug': getTenantSlug(),
      ...init?.headers,
    },
    // Storefront catalog data: cheap to cache briefly, expensive to refetch
    // on every request on a slow connection. Revalidated frequently enough
    // that a just-activated product doesn't stay invisible for long.
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`API request failed: ${init?.method ?? 'GET'} ${path} -> ${res.status}`);
  }
  return res.json() as Promise<T>;
}
