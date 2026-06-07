// @/lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr';

// Khởi tạo thực thể an toàn phòng thủ lỗi build-time của Vercel
export const supabase = typeof window !== 'undefined' 
  ? createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co', 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJplaceholder'
    ) 
  : (null as any);