'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Upload, Settings, PieChart, AlertTriangle, Wrench } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/import', label: 'Import', icon: Upload },
    { href: '/conflicts', label: 'Conflicts', icon: AlertTriangle },
    { href: '/holdings', label: 'Holdings', icon: PieChart },
    { href: '/tools', label: 'Tools', icon: Wrench },
    { href: '/settings/accounts', label: 'Accounts', icon: Settings },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            <Link href="/dashboard" className="flex items-center px-3 py-2 text-xl font-bold text-gray-900">
              OneApp Portfolio
            </Link>
          </div>
          <div className="flex space-x-4">
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
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

