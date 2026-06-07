// ==================== 2. PHÍA BROWSER (CLIENT COMPONENT) ====================
import { createBrowserClient } from '@supabase/ssr';

// Thay vì export biến tĩnh, ta dùng hàm để khởi tạo an toàn
export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.warn("Supabase credentials missing during build time.");
    return null as any;
  }

  return createBrowserClient(url, anonKey);
}

// Nếu trong các Client Component khác bạn đang import biến `supabase`, 
// hãy tạo một thực thể an toàn kiểm tra môi trường window trước:
export const supabase = typeof window !== 'undefined' 
  ? createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ) 
  : (null as any);