import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server'; // [QUAN TRỌNG] Dùng Server Client để đồng bộ Cookie

export async function POST(request: Request) {
  try { 
    const { email, password, name } = await request.json();

    // 1. Kiểm tra dữ liệu đầu vào
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu!' },
        { status: 400 } 
      );
    }

    // Khởi tạo Server Client phục vụ cho cả việc check DB và Auth
    const supabaseServer = await createClient();

    // 2. Kiểm tra giới hạn 500 người dùng hệ thống
    const { count, error: countError } = await supabaseServer
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

    // 3. Tiến hành đăng ký tài khoản Auth trên Supabase thông qua Server Client
    const { data: authData, error: authError } = await supabaseServer.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 } 
      );
    }

    // 4. Nếu tạo Auth thành công, chèn dữ liệu đồng bộ vào bảng public.users
    if (authData.user) {
      const { error: insertError } = await supabaseServer
        .from('users')
        .insert([
          { 
            id: authData.user.id,
            email: email,
            full_name: name, // Chèn vào đúng cột full_name tương thích với cấu trúc DB.png của bạn
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
    console.error("Lỗi hệ thống tại API Register:", err);
    return NextResponse.json(
      { error: `Lỗi hệ thống: ${err.message}` },
      { status: 500 } 
    );
  }
}