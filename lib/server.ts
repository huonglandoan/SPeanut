import { createServerClient, createBrowserClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// 1. PHÍA SERVER (Server Component / API Route)
export async function createClient() {
  // Điền giá trị fallback (mã giả) khi build để Next.js không bị crash, 
  // khi chạy thật trên Vercel nó sẽ lấy đúng biến môi trường thật trong Settings.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJplaceholder';

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {}
      },
    },
  });
}

// 2. PHÍA BROWSER (Client Component)
export const supabase = typeof window !== 'undefined' 
  ? createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co', 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJplaceholder'
    ) 
  : (null as any);