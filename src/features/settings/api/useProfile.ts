import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuthStore } from '@/shared/lib/auth';
import type { Database } from '@/types/database';
import type { CurrencyCode } from '@/shared/lib/money';

// `base_currency` es `text` con check (CRC|USD) en la base — el codegen de
// Supabase no modela checks como literal union, así que se angosta acá.
type Profile = Omit<Database['public']['Tables']['profiles']['Row'], 'base_currency'> & {
  base_currency: CurrencyCode;
};
type ProfileUpdate = Partial<Pick<Profile, 'display_name' | 'base_currency'>>;

export function useProfile() {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: ['profile', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .single();
      if (error) throw error;
      return data as Profile;
    },
  });
}

export function useUpdateProfile() {
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (update: ProfileUpdate) => {
      const { error } = await supabase.from('profiles').update(update).eq('id', userId!);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });
}
