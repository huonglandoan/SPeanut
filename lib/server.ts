// @/lib/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';

export async function createClient() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJplaceholder';

  try {
    const reqHeaders = await headers();
    const customUrl = reqHeaders.get('x-supabase-url');
    const customAnonKey = reqHeaders.get('x-supabase-anon-key');
    if (customUrl && customAnonKey) {
      url = customUrl;
      anonKey = customAnonKey;
    }
  } catch (e) {
    // Falls back to defaults if called in static build context or other scenarios
  }

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