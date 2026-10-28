import { NavLink, Outlet } from 'react-router';
import clsx from 'clsx';
import {
  ArrowLeftRight,
  BarChart3,
  LayoutDashboard,
  PiggyBank,
  Settings,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

const NAV_ITEMS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard },
  { to: '/transactions', label: 'Movimientos', icon: ArrowLeftRight },
  { to: '/accounts', label: 'Cuentas', icon: Wallet },
  { to: '/budgets', label: 'Presupuestos', icon: PiggyBank },
  { to: '/reports', label: 'Informes', icon: BarChart3 },
  { to: '/settings', label: 'Ajustes', icon: Settings },
];

/**
 * Shell de la app: bottom tab bar en móvil (al alcance del pulgar),
 * sidebar en pantallas >= md. Respeta las safe areas del dispositivo
 * (notch / home indicator) — ver plan §4.9.
 */
export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="hidden border-r border-border p-4 md:block md:w-56">
        <SidebarNav />
      </aside>

      <main className="flex-1 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 flex border-t border-border bg-surface/95 backdrop-blur md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {NAV_ITEMS.map((item) => (
          <TabLink key={item.to} to={item.to} label={item.label} icon={item.icon} />
        ))}
      </nav>
    </div>
  );
}

function SidebarNav() {
  return (
    <ul className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <li key={to}>
          <NavLink
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium',
                isActive
                  ? 'bg-ink text-paper'
                  : 'text-ink-muted hover:bg-surface-sunken',
              )
            }
            end={to === '/'}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

function TabLink({ to, label, icon: Icon }: { to: string; label: string; icon: LucideIcon }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        clsx(
          'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium',
          isActive ? 'text-ink' : 'text-ink-muted',
        )
      }
    >
      <Icon className="size-5" aria-hidden />
      {label}
    </NavLink>
  );
}
