import { NextResponse } from 'next/server';
import { createClient, ensureUserProfileExists } from '@/lib/server';

/**
 * GET /api/profile
 * Lấy thông tin profile của user hiện tại (dựa vào session cookie)
 */
export async function GET() {
  try {
    const supabaseServer = await createClient();
    const { data: { session } } = await supabaseServer.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Chưa đăng nhập.' },
        { status: 401 }
      );
    }

    // Đảm bảo profile người dùng đã tồn tại trong public.users trước khi truy vấn
    await ensureUserProfileExists(supabaseServer, session.user);

    // Lấy đầy đủ các cột thông tin người dùng bao gồm avatar, qr_code, các trường ngân hàng, extra_incomes và cancelled_sessions.
    const selectStr = 'id, email, full_name, avatar, bank_brand, bank_number, bank_owner, qr_code, extra_incomes, cancelled_sessions';
    try {
      const { data, error } = await supabaseServer
        .from('users')
        .select(selectStr)
        .eq('id', session.user.id)
        .single();

      if (error) {
        // Dự phòng nếu lỗi query do cấu trúc database chưa được migrate hoàn chỉnh
        console.error('Lỗi truy vấn profile (fallback to session):', error);
        return NextResponse.json({ 
          id: session.user.id, 
          email: session.user.email, 
          full_name: '',
          avatar: '',
          bank_brand: '',
          bank_number: '',
          bank_owner: '',
          qr_code: '',
          extra_incomes: {}
        }, { status: 200 });
      }

      if (!data) {
        return NextResponse.json({ 
          id: session.user.id, 
          email: session.user.email, 
          full_name: '',
          avatar: '',
          bank_brand: '',
          bank_number: '',
          bank_owner: '',
          qr_code: '',
          extra_incomes: {}
        }, { status: 200 });
      }

      return NextResponse.json(data, { status: 200 });
    } catch (err) {
      console.error('Unexpected error fetching profile, returning session fallback:', err);
      return NextResponse.json({ 
        id: session.user.id, 
        email: session.user.email, 
        full_name: '',
        avatar: '',
        bank_brand: '',
        bank_number: '',
        bank_owner: '',
        qr_code: '',
        extra_incomes: {}
      }, { status: 200 });
    }
  } catch (err: any) {
    console.error('Lỗi hệ thống tại API GET /api/profile:', err);
    return NextResponse.json(
      { error: err.message || 'Lỗi hệ thống.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile
 * Cập nhật thông tin profile của user hiện tại
 */
export async function PUT(request: Request) {
  try {
    const supabaseServer = await createClient();
    const { data: { session } } = await supabaseServer.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Chưa đăng nhập.' },
        { status: 401 }
      );
    }

    // Đảm bảo profile người dùng đã tồn tại trong public.users trước khi cập nhật
    await ensureUserProfileExists(supabaseServer, session.user);

    const body = await request.json();

    // Cho phép cập nhật full_name, avatar, qr_code, và các trường ngân hàng nhận diện tự động từ QR code, extra_incomes, và cancelled_sessions
    const allowedFields = ['full_name', 'avatar', 'qr_code', 'bank_brand', 'bank_number', 'bank_owner', 'extra_incomes', 'cancelled_sessions'];
    const updateData: Record<string, any> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    console.log('[debug] PUT /api/profile - incoming body keys:', Object.keys(body));
    console.log('[debug] PUT /api/profile - initial updateData keys:', Object.keys(updateData));

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Không có dữ liệu để cập nhật.' },
        { status: 400 }
      );
    }

    let lastError: any = null;
    const maxAttempts = Object.keys(updateData).length || 1;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const { data, error } = await supabaseServer
        .from('users')
        .update(updateData)
        .eq('id', session.user.id)
        .select()
        .single();

      if (!error) {
        return NextResponse.json(data, { status: 200 });
      }

      lastError = error;

      // Nếu gặp lỗi do cột chưa tồn tại (PGRST204), loại bỏ cột lỗi và thử lại
      if (error.code === 'PGRST204' && typeof error.message === 'string') {
        console.warn('[api] PostgREST PGRST204 error message:', error.message);
        const match = error.message.match(/'([^']+)'/);
        const colName = match ? match[1] : null;
        if (colName && Object.prototype.hasOwnProperty.call(updateData, colName)) {
          console.warn('[api] Removing missing column from updateData and retrying:', colName);
          delete updateData[colName];
          if (Object.keys(updateData).length === 0) break;
          continue; // retry
        }
      }

      console.error('Lỗi cập nhật profile:', error);
      break;
    }

    console.error('Lỗi cập nhật profile (final):', lastError);
    return NextResponse.json(
      { error: 'Không thể lưu thông tin cá nhân. Vui lòng đảm bảo các cột cơ sở dữ liệu đã được migrate.' },
      { status: 500 }
    );
  } catch (err: any) {
    console.error('Lỗi hệ thống tại API PUT /api/profile:', err);
    return NextResponse.json(
      { error: err.message || 'Lỗi hệ thống.' },
      { status: 500 }
    );
  }
}
