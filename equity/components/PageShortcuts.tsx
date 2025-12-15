'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon } from 'lucide-react';

export interface ShortcutLink {
  href: string;
  label: string;
  icon?: LucideIcon;
}

interface PageShortcutsProps {
  links: ShortcutLink[];
  title?: string;
}

export default function PageShortcuts({ links, title }: PageShortcutsProps) {
  const pathname = usePathname();

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2 py-3 overflow-x-auto no-scrollbar">
          {title && (
            <span className="text-sm font-semibold text-gray-500 mr-4 uppercase tracking-wider hidden sm:block flex-shrink-0">
              {title}
            </span>
          )}
          {links.map((link) => {
            const Icon = link.icon;
            // Check for exact match or subpath match, but be careful with root paths
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href + '/'));
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors flex-shrink-0 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {Icon && <Icon className="h-4 w-4 mr-2" />}
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}



