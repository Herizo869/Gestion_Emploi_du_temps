import { createClient } from "@supabase/supabase-js";

const supabaseUrl = ((import.meta as any).env?.VITE_SUPABASE_URL) as string;
const supabaseAnonKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY) as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Supabase] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquant dans .env"
  );
}

/**
 * Client Supabase JS — utiliser pour l'authentification Supabase,
 * le stockage, les souscriptions realtime, etc.
 *
 * Pour les données métier, le frontend continue d'appeler Emit.Api (C#).
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
