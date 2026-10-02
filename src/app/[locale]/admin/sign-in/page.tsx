import { redirect } from '@/i18n/navigation';

// Staff sign in on the same screen as buyers (email + password); it sends each role to its own area.
export default async function AdminSignInPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: '/account/sign-in', locale });
}
