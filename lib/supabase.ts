import { createBrowserClient } from '@supabase/ssr';
export function configured(){return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('YOUR_PROJECT'))}
export function supabase(){
  if(!configured()) throw new Error('Configurez les variables Supabase dans .env.local');
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
