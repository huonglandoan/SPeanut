import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Định nghĩa hàm POST để hứng dữ liệu đăng ký từ Frontend gửi lên
export async function POST(request: Request) {
  try {
    // PHẦN 1: BÓC TÁCH DỮ LIỆU TỪ FRONTEND
    const { email, password, name } = await request.json();

    // Kiểm tra nhanh xem Frontend có quên gửi trường nào bắt buộc không
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ Email và Mật khẩu!' },
        { status: 400 } // 400: Bad Request (Lỗi do dữ liệu đầu vào)
      );
    }

    // ⚙️ PHẦN 2: XỬ LÝ LOGIC NGHIỆP VỤ (BUSINESS LOGIC)

    // Bước 2.1: Vào Database đếm số lượng tài khoản hiện có trong bảng 'users'
    // Dùng tùy chọn { count: 'exact', head: true } để Supabase chỉ đếm số lượng chứ không lấy hết data ra, chạy cực nhanh
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw countError; // Nếu lỗi kết nối DB, lập tức nhảy xuống khối catch(err) ở dưới
    }

    // 🛡️ CHỐT CHẶN BẢO MẬT: Kiểm tra nếu hệ thống đã đủ hoặc vượt quá 50 người
    if (count !== null && count >= 500) {
      return NextResponse.json(
        { error: 'Đăng ký thất bại! Hệ thống Peanut Salary đã đạt giới hạn tối đa 500 người dùng.' },
        { status: 403 } // 403: Forbidden (Bị hệ thống từ chối do vi phạm luật)
      );
    }

    // Bước 2.2: Nếu chưa đủ 500 người, ra lệnh cho hệ thống Auth của Supabase tạo tài khoản
    // Supabase sẽ tự động băm (hash) và mã hóa mật khẩu an toàn cho cậu
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 } // Lỗi từ Supabase (Ví dụ: Email đã tồn tại, pass quá ngắn...)
      );
    }

    // Bước 2.3: ĐỒNG BỘ DỮ LIỆU VÀO BẢNG USERS LOCAL
    // Sau khi Supabase Auth tạo user thành công, mình lưu thêm 1 bản ghi vào bảng 'users' riêng của mình
    if (authData.user) {
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          { 
            id: authData.user.id, // Lấy đúng ID từ hệ thống Auth quăng qua để đồng bộ danh tính
            email: email,
            name: name || 'Thành viên mới',
            role: 'user' // Mặc định tài khoản mới tạo là user thường
          }
        ]);

      if (insertError) {
        return NextResponse.json(
          { error: `Tạo tài khoản Auth OK nhưng lỗi đồng bộ DB: ${insertError.message}` },
          { status: 500 }
        );
      }
    }

    // 📤 PHẦN 3: TRẢ KẾT QUẢ THÀNH CÔNG VỀ CHO CLIENT
    return NextResponse.json(
      { message: 'Chúc mừng Mimi, đăng ký tài khoản mới thành công!' },
      { status: 200 } // 200: OK (Thành công tốt đẹp)
    );

  } catch (err: any) {
    // Bắt các lỗi hệ thống đột xuất (Đứt mạng, sập DB...) để app không bị sập nguồn
    return NextResponse.json(
      { error: `Lỗi hệ thống nghiêm trọng: ${err.message}` },
      { status: 500 } // 500: Internal Server Error
    );
  }
}