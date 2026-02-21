import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

type Database = any;

let supabaseClient: SupabaseClient<Database> | null = null;

export function getClient(): SupabaseClient<Database> | null {
    if (supabaseClient) return supabaseClient;

    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase credentials not configured. Using mock data.');
        return null;
    }

    supabaseClient = createSupabaseClient(supabaseUrl, supabaseAnonKey);
    return supabaseClient;
}
