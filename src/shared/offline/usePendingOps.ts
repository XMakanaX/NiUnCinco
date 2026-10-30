import { useCallback, useEffect, useState } from 'react';
import { listOps, QUEUE_CHANGED_EVENT } from '@/shared/offline/queue';
import type { PendingOp } from '@/shared/offline/types';

export function usePendingOps(userId: string | undefined) {
  const [ops, setOps] = useState<PendingOp[]>([]);

  const refresh = useCallback(async () => {
    setOps(userId ? await listOps(userId) : []);
  }, [userId]);

  useEffect(() => {
    void refresh();
    window.addEventListener(QUEUE_CHANGED_EVENT, refresh);
    window.addEventListener('online', refresh);
    return () => {
      window.removeEventListener(QUEUE_CHANGED_EVENT, refresh);
      window.removeEventListener('online', refresh);
    };
  }, [refresh]);

  return {
    pending: ops.filter((op) => op.status === 'pending'),
    failed: ops.filter((op) => op.status === 'failed'),
  };
}
