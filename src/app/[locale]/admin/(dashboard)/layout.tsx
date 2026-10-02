import { AdminFrame } from '@/components/admin/AdminFrame';

export const dynamic = 'force-dynamic';

// Guard + chrome for every dashboard page (see AdminFrame).
export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return <AdminFrame>{children}</AdminFrame>;
}
