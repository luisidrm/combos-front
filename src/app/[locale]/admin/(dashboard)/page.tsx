import { redirect } from '@/i18n/navigation';

// The dashboard's front door is the order queue.
export default async function AdminIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: '/admin/orders', locale });
}
