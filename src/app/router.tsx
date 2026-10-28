import { createBrowserRouter } from 'react-router';
import { AppShell } from '@/app/layouts/AppShell';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { TransactionsPage } from '@/features/transactions/TransactionsPage';
import { AccountsPage } from '@/features/accounts/AccountsPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { LoginPage } from '@/features/auth/LoginPage';

/**
 * Rutas por §4.7 del plan. El guard de sesión (ruta privada -> /login)
 * se añade en la Fase 3, junto con /register y /reset-password.
 */
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'transactions', element: <TransactionsPage /> },
      { path: 'accounts', element: <AccountsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
