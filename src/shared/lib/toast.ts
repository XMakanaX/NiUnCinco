import { toast as sonnerToast } from 'sonner';

/**
 * Wrapper delgado sobre sonner. Voz de interfaz, no de persona: dice qué
 * pasó y qué hacer, nunca se disculpa (ver skill frontend-design).
 */
export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  info: (message: string) => sonnerToast(message),
};
