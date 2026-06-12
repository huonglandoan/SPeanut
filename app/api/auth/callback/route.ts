import { NextResponse } from 'next/server';
import { createClient, ensureUserProfileExists } from '@/lib/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data?.user) {
      // Đảm bảo thông tin user tồn tại trong bảng public.users
      await ensureUserProfileExists(supabase, data.user);
      
      // Đăng nhập thành công, chuyển hướng về trang chủ
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Nếu có lỗi, chuyển hướng về trang login kèm thông báo lỗi
  return NextResponse.redirect(`${origin}/login?error=Google auth failed`);
}
