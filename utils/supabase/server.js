import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Cria um cliente Supabase para uso server-side
export function createClient(cookieStore) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Preferir SERVICE_KEY no server; se não existir, usar publishable (menos permissões)
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!url || !key) {
    throw new Error('Variáveis de ambiente do Supabase não configuradas: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_KEY ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY');
  }

  const supabase = createSupabaseClient(url, key, {
    auth: { persistSession: false }
  });

  // Aqui poderíamos aplicar cookies/session se necessário
  return supabase;
}
