import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient, ensureUserProfileExists } from '@/lib/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  
  // Kiểm tra xem Supabase/Google có trả về lỗi trực tiếp không
  const oauthError = searchParams.get('error_description') || searchParams.get('error');
  if (oauthError) {
    console.error("[auth-callback] Lỗi từ OAuth provider:", oauthError);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(oauthError)}`);
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("[auth-callback] Lỗi trao đổi code lấy session:", error.message);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }
    
    if (data?.user) {
      // Đảm bảo thông tin user tồn tại trong bảng public.users
      await ensureUserProfileExists(supabase, data.user);
      
      // Lưu Google provider tokens vào cookies nếu có
      if (data.session) {
        const cookieStore = await cookies();
        if (data.session.provider_token) {
          cookieStore.set('google_provider_token', data.session.provider_token, {
            path: '/',
            maxAge: 3600, // 1 hour
            sameSite: 'lax',
            secure: true,
          });
        }
        if (data.session.provider_refresh_token) {
          cookieStore.set('google_provider_refresh_token', data.session.provider_refresh_token, {
            path: '/',
            maxAge: 30 * 24 * 3600, // 30 days
            sameSite: 'lax',
            secure: true,
          });
        }
      }
      
      // Đăng nhập thành công, chuyển hướng về trang chủ
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Nếu không có code và không có lỗi cụ thể
  return NextResponse.redirect(`${origin}/login?error=Google auth failed`);
}
