import { requireAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
    return <>{children}</>;
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      redirect('/login');
    }
    // For Forbidden, show 403 page
    notFound(); // This will show 404, but we can improve this later
  }
}

