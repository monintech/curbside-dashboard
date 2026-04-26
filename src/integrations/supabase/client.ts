import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://adtvobrzxcqszzsmfjjs.supabase.co";

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkdHZvYnJ6eGNxc3p6c21mampzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNDI5NDgsImV4cCI6MjA5MjYxODk0OH0.XucEPU9cDPBYbu79s1Mq-3icd_qQD0C_AZUUH8E0BPs";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
