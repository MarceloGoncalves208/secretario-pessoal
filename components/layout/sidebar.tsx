'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowRightLeft,
  Grid3X3,
  Calendar,
  Building2,
  Tags,
  MessageSquare,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/lib/store/ui';

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/transacoes', icon: ArrowRightLeft, label: 'Transações' },
  { href: '/matriz', icon: Grid3X3, label: 'Matriz de Saldos' },
  { href: '/agenda', icon: Calendar, label: 'Agenda' },
  { href: '/empresas', icon: Building2, label: 'Empresas' },
  { href: '/categorias', icon: Tags, label: 'Categorias' },
  { href: '/chat', icon: MessageSquare, label: 'Chat IA' },
  { href: '/perfil', icon: User, label: 'Perfil' },
];

export function Sidebar() {
  const pathname = usePathname();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);

  return (
    <aside
      className={cn(
        'fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-64 border-r bg-background transition-transform lg:static lg:translate-x-0',
        !sidebarOpen && '-translate-x-full'
      )}
    >
      <nav className="space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
