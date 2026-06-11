import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export async function POST(request: Request) {
  try { 
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu!' },
        { status: 400 } 
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Địa chỉ email không hợp lệ.' },
        { status: 400 }
      );
    }

    const supabaseServer = await createClient();

    // Kiểm tra giới hạn 500 người dùng
    const { count, error: countError } = await supabaseServer
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;
    
    if (count !== null && count >= 500) {
      return NextResponse.json(
        { error: 'Hệ thống đã đạt giới hạn tối đa 500 người dùng.' },
        { status: 403 } 
      );
    }

    // Đăng ký tài khoản
    // Trigger on_auth_user_created sẽ tự động tạo profile trong public.users
    const { data: authData, error: authError } = await supabaseServer.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name }, // Trigger dùng metadata này để lấy full_name
      },
    });

    if (authError) {
      let msg = authError.message;
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        msg = 'Email này đã được đăng ký. Vui lòng dùng email khác hoặc đăng nhập.';
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Nếu Supabase tắt "Confirm email" → session có ngay → autoLogin
    if (authData.session) {
      return NextResponse.json(
        { message: 'Đăng ký thành công!', autoLogin: true },
        { status: 200 }
      );
    }

    // Nếu vẫn bật "Confirm email" → thử login
    const { data: signInData, error: signInError } = await supabaseServer.auth.signInWithPassword({
      email,
      password,
    });

    if (!signInError && signInData.session) {
      return NextResponse.json(
        { message: 'Đăng ký thành công!', autoLogin: true },
        { status: 200 }
      );
    }

    // Fallback: yêu cầu xác nhận email
    return NextResponse.json(
      { message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.', requireConfirm: true },
      { status: 200 } 
    );

  } catch (err: any) {
    console.error('Lỗi API Register:', err);
    return NextResponse.json(
      { error: `Lỗi hệ thống: ${err.message}` },
      { status: 500 } 
    );
  }
}