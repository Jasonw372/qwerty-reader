import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function createSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    // 在 .env 未配置时返回一个空代理，类型层面已完整支持
    console.warn(
      "Supabase credentials not found. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env",
    );
  }
  return createClient<Database>(supabaseUrl ?? "", supabaseAnonKey ?? "");
}

export const supabase = createSupabaseClient();
