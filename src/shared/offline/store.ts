import { create } from 'zustand';

interface OfflineState {
  online: boolean;
  syncing: boolean;
}

export const useOfflineStore = create<OfflineState>(() => ({
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  syncing: false,
}));

export function setSyncing(syncing: boolean): void {
  useOfflineStore.setState({ syncing });
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useOfflineStore.setState({ online: true }));
  window.addEventListener('offline', () => useOfflineStore.setState({ online: false }));
}
