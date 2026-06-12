// @/lib/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';

function isValidSupabaseConfig(url: string | null, key: string | null): boolean {
  if (!url || !key) return false;
  const trimmedUrl = url.trim();
  const trimmedKey = key.trim();
  return (
    (trimmedUrl.startsWith('https://') || trimmedUrl.startsWith('http://')) &&
    trimmedKey.startsWith('eyJ') &&
    trimmedKey.split('.').length === 3
  );
}

export async function createClient() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJplaceholder';

  try {
    const reqHeaders = await headers();
    const customUrl = reqHeaders.get('x-supabase-url');
    const customAnonKey = reqHeaders.get('x-supabase-anon-key');
    if (isValidSupabaseConfig(customUrl, customAnonKey)) {
      url = customUrl!.trim();
      anonKey = customAnonKey!.trim();
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

/**
 * Đảm bảo thông tin user tồn tại trong bảng public.users để không bị lỗi khóa ngoại khi tạo lớp
 */
export async function ensureUserProfileExists(supabaseServer: any, user: any) {
  if (!user) return;
  try {
    const { data: profile, error } = await supabaseServer
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile && !error) {
      console.log(`[auth-sync] Profile for user ${user.id} not found in public.users. Creating it dynamically...`);
      const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      const { error: insertError } = await supabaseServer
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          full_name: fullName
        });
      if (insertError) {
        console.error("[auth-sync] Lỗi tự động tạo profile trong public.users:", insertError);
      }
    }
  } catch (err) {
    console.error("[auth-sync] Không thể kiểm tra hoặc tạo profile người dùng:", err);
  }
}

/**
 * Hàm lấy userId đã được xác thực và đảm bảo profile của họ tồn tại trong public.users
 */
export async function getAuthenticatedUserId() {
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return null;

  await ensureUserProfileExists(supabaseServer, user);

  return user.id;
}