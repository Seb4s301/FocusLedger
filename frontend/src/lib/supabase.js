// Las variables de entorno se configuran en .env (ver .env.example)
// VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY deben estar definidas antes de ejecutar la app
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
