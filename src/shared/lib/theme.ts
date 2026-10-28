import { create } from 'zustand';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'finanzas-theme';

function applyTheme(preference: ThemePreference) {
  const root = document.documentElement;
  if (preference === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', preference);
  }
}

function readStoredTheme(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // localStorage inaccesible: queda en "system".
  }
  return 'system';
}

interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

/**
 * Preferencia de tema persistida en localStorage. El <html data-theme>
 * ya se fija de forma síncrona en index.html antes del primer render
 * (evita el flash); este store solo sincroniza cambios posteriores desde
 * la UI (ver Fase 3: pantalla de Ajustes).
 */
export const useThemeStore = create<ThemeState>((set) => ({
  preference: readStoredTheme(),
  setPreference: (preference) => {
    applyTheme(preference);
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // Sin persistencia disponible: el cambio sigue aplicando en esta sesión.
    }
    set({ preference });
  },
}));
