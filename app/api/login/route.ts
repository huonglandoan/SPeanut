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

    let targetEmail = email.trim();
    const isAdminMode = targetEmail === 'admin';
    if (isAdminMode) {
      targetEmail = 'admin@speanut.com';
    }

    // 1. Khởi tạo Supabase Server Client (để kích hoạt cơ chế tự động ghi Cookie)
    const supabaseServer = await createClient();

    // 2. Gọi hàm đăng nhập bằng Server Client này
    let { data, error } = await supabaseServer.auth.signInWithPassword({
      email: targetEmail,
      password,
    });

    // Tự động tạo tài khoản admin nếu đăng nhập sai credentials lần đầu
    if (error && isAdminMode && (error.message.includes('Invalid login credentials') || error.message.toLowerCase().includes('invalid'))) {
      console.log('Admin user does not exist. Creating admin account...');
      const { data: signUpData, error: signUpError } = await supabaseServer.auth.signUp({
        email: targetEmail,
        password: '111111',
      });

      if (signUpError) {
        console.error('Lỗi tự động đăng ký tài khoản admin:', signUpError);
      } else if (signUpData.user) {
        // Chèn thông tin vào bảng public.users để đồng bộ
        const { error: insertError } = await supabaseServer
          .from('users')
          .insert([
            {
              id: signUpData.user.id,
              email: targetEmail,
              full_name: 'Admin SPeanut',
            }
          ]);
        if (insertError) {
          console.error('Lỗi chèn profile cho admin:', insertError);
        }

        // Đăng nhập lại sau khi tạo tài khoản thành công
        const retryRes = await supabaseServer.auth.signInWithPassword({
          email: targetEmail,
          password: '111111',
        });
        data = retryRes.data;
        error = retryRes.error;
      }
    }

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