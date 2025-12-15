'use client';

import { DollarSign, Tag, Building2, TrendingUp, TrendingDown, Repeat } from 'lucide-react';
import PageShortcuts from '@/components/PageShortcuts';

const balanceSheetLinks = [
  { href: '/balancesheet', label: 'Dashboard', icon: DollarSign },
  { href: '/balancesheet/categories', label: 'Categories', icon: Tag },
  { href: '/balancesheet/banks', label: 'Banks', icon: Building2 },
  { href: '/balancesheet/income', label: 'Income', icon: TrendingUp },
  { href: '/balancesheet/expenses', label: 'Expenses', icon: TrendingDown },
  { href: '/balancesheet/recurring', label: 'Recurring', icon: Repeat },
];

export default function BalanceSheetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PageShortcuts links={balanceSheetLinks} title="Balance Sheet" />
      {children}
    </>
  );
}
