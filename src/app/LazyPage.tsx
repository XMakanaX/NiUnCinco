import { Suspense, type ReactNode } from 'react';
import { LoadingState } from '@/shared/ui/LoadingState';

export function LazyPage({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="p-4"><LoadingState /></div>}>{children}</Suspense>
  );
}
