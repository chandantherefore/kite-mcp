import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function Home() {
  const user = await getCurrentUser();
  
  // If user is logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard');
  }
  
  // If not logged in, redirect to login
  redirect('/login');
}
