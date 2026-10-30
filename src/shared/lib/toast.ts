import { toast as sonnerToast } from 'sonner';

/**
 * Wrapper delgado sobre sonner. Voz de interfaz, no de persona: dice qué
 * pasó y qué hacer, nunca se disculpa (ver skill frontend-design).
 */
export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  info: (message: string) => sonnerToast(message),
  /** Toast persistente con un botón de acción — usado por el aviso de
   * actualización del service worker (Fase 13), que no debe desaparecer
   * solo ni recargar sin que el usuario lo decida. */
  action: (message: string, action: { label: string; onClick: () => void }) =>
    sonnerToast(message, { action, duration: Infinity }),
};
