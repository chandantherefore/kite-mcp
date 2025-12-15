'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { 
  Home, Upload, Settings, PieChart, AlertTriangle, Wrench, 
  BookOpen, FileText, Shield, LogOut, LogIn, UserPlus, 
  Menu, X, ChevronDown, ChevronUp, User, Briefcase, 
  DollarSign, Building2, Tag, TrendingUp, TrendingDown, Repeat
} from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const toggleAccordion = (section: string) => {
    setOpenAccordion(openAccordion === section ? null : section);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
    setIsMenuOpen(false);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setOpenAccordion(null);
  };

  const equityLinks = [
    { href: '/tradebook', label: 'Tradebook', icon: BookOpen },
    { href: '/holdings', label: 'Holdings', icon: PieChart },
    { href: '/ledger', label: 'Ledger', icon: FileText },
    { href: '/import', label: 'Import', icon: Upload },
  ];

  const userLinks = [
    { href: '/settings/accounts', label: 'Accounts', icon: Settings },
  ];

  const balanceSheetLinks = [
    { href: '/balancesheet', label: 'Dashboard', icon: DollarSign },
    { href: '/balancesheet/categories', label: 'Categories', icon: Tag },
    { href: '/balancesheet/banks', label: 'Banks', icon: Building2 },
    { href: '/balancesheet/income', label: 'Income', icon: TrendingUp },
    { href: '/balancesheet/expenses', label: 'Expenses', icon: TrendingDown },
    { href: '/balancesheet/recurring', label: 'Recurring', icon: Repeat },
  ];

  const standaloneLinks = [
    { href: '/conflicts', label: 'Conflicts', icon: AlertTriangle },
    { href: '/tools', label: 'Tools', icon: Wrench },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link 
              href="/dashboard" 
              className="flex items-center px-3 py-2 text-xl font-bold text-gray-900"
              onClick={closeMenu}
            >
              <Home className="h-6 w-6 mr-2" />
              OneApp Portfolio
            </Link>
          </div>

          <div className="flex items-center">
            {status === 'authenticated' ? (
              <>
                {/* Hamburger Menu Button */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                  aria-expanded={isMenuOpen}
                >
                  {isMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      {status === 'authenticated' && isMenuOpen && (
        <div className="absolute right-0 top-16 w-80 bg-white shadow-lg border-l border-b border-gray-200 z-50 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="py-2">
            {/* User Menu Accordion */}
            <div className="border-b border-gray-200">
              <button
                onClick={() => toggleAccordion('user')}
                className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-3 text-gray-600" />
                  <span>User Menu</span>
                </div>
                {openAccordion === 'user' ? (
                  <ChevronUp className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                )}
              </button>
              {openAccordion === 'user' && (
                <div className="bg-gray-50">
                  {userLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={closeMenu}
                        className={`flex items-center px-8 py-3 text-sm ${
                          isActive
                            ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600'
                            : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
                        }`}
                      >
                        <Icon className="h-4 w-4 mr-3" />
                        {link.label}
                      </Link>
                    );
                  })}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-8 py-3 text-sm text-red-600 hover:bg-red-50 border-l-4 border-transparent"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Equity Menu Accordion */}
            <div className="border-b border-gray-200">
              <button
                onClick={() => toggleAccordion('equity')}
                className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-3 text-gray-600" />
                  <span>Equity Menu</span>
                </div>
                {openAccordion === 'equity' ? (
                  <ChevronUp className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                )}
              </button>
              {openAccordion === 'equity' && (
                <div className="bg-gray-50">
                  {equityLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={closeMenu}
                        className={`flex items-center px-8 py-3 text-sm ${
                          isActive
                            ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600'
                            : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
                        }`}
                      >
                        <Icon className="h-4 w-4 mr-3" />
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Balance Sheet Menu Accordion */}
            <div className="border-b border-gray-200">
              <button
                onClick={() => toggleAccordion('balancesheet')}
                className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-3 text-gray-600" />
                  <span>Balance Sheet</span>
                </div>
                {openAccordion === 'balancesheet' ? (
                  <ChevronUp className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                )}
              </button>
              {openAccordion === 'balancesheet' && (
                <div className="bg-gray-50">
                  {balanceSheetLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={closeMenu}
                        className={`flex items-center px-8 py-3 text-sm ${
                          isActive
                            ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600'
                            : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
                        }`}
                      >
                        <Icon className="h-4 w-4 mr-3" />
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Standalone Links */}
            {standaloneLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className={`flex items-center px-4 py-3 text-sm border-b border-gray-200 ${
                    isActive
                      ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {link.label}
                </Link>
              );
            })}

            {/* Admin Link (if admin) */}
            {(session?.user as any)?.role === 'admin' && (
              <Link
                href="/admin"
                onClick={closeMenu}
                className={`flex items-center px-4 py-3 text-sm border-b border-gray-200 ${
                  pathname.startsWith('/admin')
                    ? 'text-purple-600 bg-purple-50 border-l-4 border-purple-600'
                    : 'text-purple-600 hover:bg-purple-50 border-l-4 border-transparent'
                }`}
              >
                <Shield className="h-5 w-5 mr-3" />
                Admin
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Overlay to close menu when clicking outside */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-20"
          onClick={closeMenu}
        />
      )}
    </nav>
  );
}

