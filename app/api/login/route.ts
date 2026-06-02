import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server'; 

export async function POST(request: Request) {
  console.log('API /api/login called');

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email và mật khẩu là bắt buộc.' },
        { status: 400 }
      );
    }

    // 1. Khởi tạo Supabase Server Client (để kích hoạt cơ chế tự động ghi Cookie)
    const supabaseServer = await createClient();

    // 2. Gọi hàm đăng nhập bằng Server Client này
    const { data, error } = await supabaseServer.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (!data.session) {
      return NextResponse.json(
        { error: 'Đăng nhập không thành công. Vui lòng thử lại.' },
        { status: 500 }
      );
    }

    // 3. Trả về thành công. Nhờ có hàm setAll trong `lib/server.ts`, 
    // Supabase đã tự động đính kèm Cookie chứa Token vào Response gửi về cho Trình duyệt rồi.
    return NextResponse.json({
      success: true,
      user: data.user, // Trả thông tin user về nếu Frontend cần hiển thị tên/avatar
    }, { status: 200 });

  } catch (err: any) {
    console.error("Lỗi hệ thống tại API Login:", err);
    return NextResponse.json(
      { error: err.message || 'Lỗi hệ thống khi đăng nhập.' },
      { status: 500 }
    );
  }
}