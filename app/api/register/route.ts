import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  'https://pnsuumytsxszeberladw.supabase.co', 
  'sb_publishable_rkd_TagfjTnUVgAdP_eofA_LHTKt3Ra'
);

export async function POST(request: Request) {
  try { 
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu!' },
        { status: 400 } 
      );
    }
    const { count, error: countError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw countError; 
    }
    if (count !== null && count >= 500) {
      return NextResponse.json(
        { error: 'Đăng ký thất bại! Hệ thống SPeanut đã đạt giới hạn tối đa 500 người dùng.' },
        { status: 403 } 
      );
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email,
      password,
      
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 } 
      );
    }

    if (authData.user) {
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert([
          { 
            id: authData.user.id,
            email: email,
            full_name: name,
          }
        ]);

      if (insertError) {
        return NextResponse.json(
          { error: `Tạo tài khoản thành công nhưng lỗi đồng bộ dữ liệu!: ${insertError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { message: 'Chúc mừng bạn, đăng ký tài khoản mới thành công!' },
      { status: 200 } 
    );

  } catch (err: any) {
    return NextResponse.json(
      { error: `Lỗi hệ thống ${err.message}` },
      { status: 500 } 
    );
  }
}