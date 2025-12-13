import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';

export default async function AccountsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  return <>{children}</>;
}

