// Phase 1: one storefront, one tenant (CLAUDE.md section 1 — subdomains and
// per-tenant routing are M7). The slug lives in an env var until then.
export function getTenantSlug(): string {
  return process.env.NEXT_PUBLIC_TENANT_SLUG || 'demo';
}
