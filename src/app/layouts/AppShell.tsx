import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router';
import clsx from 'clsx';

const NAV_ITEMS = [
  { to: '/', label: 'Inicio' },
  { to: '/transactions', label: 'Movimientos' },
  { to: '/accounts', label: 'Cuentas' },
  { to: '/settings', label: 'Ajustes' },
] as const;

/**
 * Shell de la app: bottom tab bar en móvil (al alcance del pulgar),
 * sidebar en pantallas >= md. Respeta las safe areas del dispositivo
 * (notch / home indicator) — ver plan §4.9.
 */
export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="hidden border-r border-neutral-200 p-4 md:block md:w-56 dark:border-neutral-800">
        <SidebarNav />
      </aside>

      <main className="flex-1 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 flex border-t border-neutral-200 bg-white/95 backdrop-blur md:hidden dark:border-neutral-800 dark:bg-neutral-950/95"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {NAV_ITEMS.map((item) => (
          <TabLink key={item.to} to={item.to} label={item.label} />
        ))}
      </nav>
    </div>
  );
}

function SidebarNav() {
  return (
    <ul className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <li key={item.to}>
          <NavLink
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'block rounded-md px-3 py-2 text-sm font-medium',
                isActive
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900',
              )
            }
            end={item.to === '/'}
          >
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

function TabLink({ to, label }: { to: string; label: ReactNode }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        clsx(
          'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium',
          isActive ? 'text-neutral-900 dark:text-white' : 'text-neutral-400',
        )
      }
    >
      {label}
    </NavLink>
  );
}
