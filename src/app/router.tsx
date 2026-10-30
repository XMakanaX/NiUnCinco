import { lazy } from 'react';
import { createBrowserRouter } from 'react-router';
import { AppShell } from '@/app/layouts/AppShell';
import { RequireAuth } from '@/app/RequireAuth';
import { GuestOnly } from '@/app/GuestOnly';
import { ErrorPage } from '@/app/ErrorPage';
import { NotFoundPage } from '@/app/NotFoundPage';
import { LazyPage } from '@/app/LazyPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { UpdatePasswordPage } from '@/features/auth/UpdatePasswordPage';

/**
 * Páginas pesadas (features) cargadas con `lazy` — eran el único bundle
 * de 1.1MB sin dividir (warning desde la Fase 3). Las páginas de auth
 * quedan eager: son pequeñas y están en el camino crítico de entrada.
 */
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const TransactionsPage = lazy(() =>
  import('@/features/transactions/TransactionsPage').then((m) => ({ default: m.TransactionsPage })),
);
const AccountsPage = lazy(() =>
  import('@/features/accounts/AccountsPage').then((m) => ({ default: m.AccountsPage })),
);
const BudgetsPage = lazy(() =>
  import('@/features/budgets/BudgetsPage').then((m) => ({ default: m.BudgetsPage })),
);
const ReportsPage = lazy(() =>
  import('@/features/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })),
);
const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const QuickExpensePage = lazy(() =>
  import('@/features/quick-expense/QuickExpensePage').then((m) => ({ default: m.QuickExpensePage })),
);
const ImportCsvPage = lazy(() =>
  import('@/features/import-csv/ImportCsvPage').then((m) => ({ default: m.ImportCsvPage })),
);
const DesignSystemPage = lazy(() =>
  import('@/app/DesignSystemPage').then((m) => ({ default: m.DesignSystemPage })),
);

/**
 * Rutas por §4.7 del plan. /quick-expense no se enlaza en el nav: es el
 * único destino que abre el atajo de iOS (regla global 11 del plan
 * maestro), pero igual requiere sesión — RequireAuth lo protege junto
 * con el resto de la app.
 */
export const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    errorElement: <ErrorPage />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    // Sesión temporal de recovery: ni GuestOnly ni RequireAuth la manejan bien.
    path: '/update-password',
    element: <UpdatePasswordPage />,
    errorElement: <ErrorPage />,
  },
  {
    element: <RequireAuth />,
    errorElement: <ErrorPage />,
    children: [
      // Vitrina interna del sistema de diseño (Fase 2). No se enlaza en el
      // nav; protegida por RequireAuth desde la Fase 14 (quedaba pública).
      {
        path: '/dev/design-system',
        element: (
          <LazyPage>
            <DesignSystemPage />
          </LazyPage>
        ),
      },
      {
        path: '/quick-expense',
        element: (
          <LazyPage>
            <QuickExpensePage />
          </LazyPage>
        ),
      },
      {
        path: '/',
        element: <AppShell />,
        children: [
          {
            index: true,
            element: (
              <LazyPage>
                <DashboardPage />
              </LazyPage>
            ),
          },
          {
            path: 'transactions',
            element: (
              <LazyPage>
                <TransactionsPage />
              </LazyPage>
            ),
          },
          {
            path: 'transactions/import',
            element: (
              <LazyPage>
                <ImportCsvPage />
              </LazyPage>
            ),
          },
          {
            path: 'accounts',
            element: (
              <LazyPage>
                <AccountsPage />
              </LazyPage>
            ),
          },
          {
            path: 'budgets',
            element: (
              <LazyPage>
                <BudgetsPage />
              </LazyPage>
            ),
          },
          {
            path: 'reports',
            element: (
              <LazyPage>
                <ReportsPage />
              </LazyPage>
            ),
          },
          {
            path: 'settings',
            element: (
              <LazyPage>
                <SettingsPage />
              </LazyPage>
            ),
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
