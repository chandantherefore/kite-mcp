'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Home, Upload, Settings, PieChart, AlertTriangle, Wrench, BookOpen, FileText, Shield, LogOut, LogIn, UserPlus } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/tradebook', label: 'Tradebook', icon: BookOpen },
    { href: '/holdings', label: 'Holdings', icon: PieChart },
    { href: '/ledger', label: 'Ledger', icon: FileText },
    { href: '/import', label: 'Import', icon: Upload },
    { href: '/conflicts', label: 'Conflicts', icon: AlertTriangle },
    { href: '/tools', label: 'Tools', icon: Wrench },
    { href: '/settings/accounts', label: 'Accounts', icon: Settings },
  ];

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            <Link href="/dashboard" className="flex items-center px-3 py-2 text-xl font-bold text-gray-900">
              OneApp Portfolio
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {status === 'authenticated' ? (
              <>
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium ${
                        isActive
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {link.label}
                    </Link>
                  );
                })}
                
                {(session?.user as any)?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium ${
                      pathname.startsWith('/admin')
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-purple-500 hover:text-purple-700 hover:border-purple-300'
                    }`}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </Link>
                )}
                
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

