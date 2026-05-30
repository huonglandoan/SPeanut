import { createClient } from '@supabase/supabase-js';

// Quét sạch tất cả các tên biến có thể có trên cả Local lẫn Vercel Server
const supabaseUrl = 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.SUPABASE_URL || 
  'https://pnsuumytsxszeberladw.supabase.co'; // Dán thẳng link cứng vào đây làm phương án dự phòng cuối cùng

const supabaseKey = 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  'sb_publishable_rkd_TagfjTnUVgAdP_eofA_LHTKt3Ra'; // Dán thẳng key cứng vào đây làm phương án dự phòng cuối cùng

export const supabase = createClient(supabaseUrl, supabaseKey);