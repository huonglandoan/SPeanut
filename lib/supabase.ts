import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Tạo và xuất bản instance supabase để xài toàn app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);