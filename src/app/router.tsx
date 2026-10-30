import { createBrowserRouter } from 'react-router';
import { AppShell } from '@/app/layouts/AppShell';
import { RequireAuth } from '@/app/RequireAuth';
import { GuestOnly } from '@/app/GuestOnly';
import { ErrorPage } from '@/app/ErrorPage';
import { NotFoundPage } from '@/app/NotFoundPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { TransactionsPage } from '@/features/transactions/TransactionsPage';
import { AccountsPage } from '@/features/accounts/AccountsPage';
import { BudgetsPage } from '@/features/budgets/BudgetsPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { QuickExpensePage } from '@/features/quick-expense/QuickExpensePage';
import { ImportCsvPage } from '@/features/import-csv/ImportCsvPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { UpdatePasswordPage } from '@/features/auth/UpdatePasswordPage';
import { DesignSystemPage } from '@/app/DesignSystemPage';

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
    // Vitrina interna del sistema de diseño (Fase 2). No se enlaza en el
    // nav — se retira o se protege antes de producción (Fase 15).
    path: '/dev/design-system',
    element: <DesignSystemPage />,
  },
  {
    element: <RequireAuth />,
    errorElement: <ErrorPage />,
    children: [
      { path: '/quick-expense', element: <QuickExpensePage /> },
      {
        path: '/',
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'transactions', element: <TransactionsPage /> },
          { path: 'transactions/import', element: <ImportCsvPage /> },
          { path: 'accounts', element: <AccountsPage /> },
          { path: 'budgets', element: <BudgetsPage /> },
          { path: 'reports', element: <ReportsPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
