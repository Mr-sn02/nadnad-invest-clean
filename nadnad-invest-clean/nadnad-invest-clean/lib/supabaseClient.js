// lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Sedikit guard supaya kalau env belum di-set, error-nya jelas
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase env vars missing. Pastikan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY sudah di-set."
  );
}

// Named export
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Default export (supaya import supabase from "..." juga tetap jalan)
export default supabase;
