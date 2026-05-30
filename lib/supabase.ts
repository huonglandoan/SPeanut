import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Dòng này giúp bốc đúng biến ANON_KEY mà bạn vừa sửa trên Vercel
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; 

export const supabase = createClient(supabaseUrl, supabaseKey);