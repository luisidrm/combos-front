// This whole section is a per-user client SPA (CLAUDE.md section 7) — never
// static, always re-checked against the live session.
export const dynamic = 'force-dynamic';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
