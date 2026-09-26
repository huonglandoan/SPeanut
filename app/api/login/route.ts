import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server'; 

async function seedDemoUserDataIfNeeded(supabaseServer: any, userId: string) {
  try {
    const { data: existingClasses } = await supabaseServer
      .from('classes')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (existingClasses && existingClasses.length > 0) {
      return;
    }

    const { data: cls1 } = await supabaseServer.from('classes').insert({
      user_id: userId,
      name: 'Tiếng Anh Giao Tiếp K12',
      short_name: 'TAGT',
      rate_per_session: 220000,
      type: 'FIXED'
    }).select().single();

    const { data: cls2 } = await supabaseServer.from('classes').insert({
      user_id: userId,
      name: 'IELTS Master 6.5+',
      short_name: 'IELTS',
      rate_per_session: 250000,
      type: 'FIXED'
    }).select().single();

    const { data: cls3 } = await supabaseServer.from('classes').insert({
      user_id: userId,
      name: 'Phụ đạo Luyện Đề Cuối Tuần',
      short_name: 'PDLT',
      rate_per_session: 200000,
      type: 'EXTRA'
    }).select().single();

    if (cls1?.id) {
      await supabaseServer.from('class_schedules').insert([
        { class_id: cls1.id, day_of_week: 1, start_time: '17:30:00', end_time: '19:30:00', valid_from: '2026-01-01' },
        { class_id: cls1.id, day_of_week: 3, start_time: '17:30:00', end_time: '19:30:00', valid_from: '2026-01-01' }
      ]);
    }

    if (cls2?.id) {
      await supabaseServer.from('class_schedules').insert([
        { class_id: cls2.id, day_of_week: 2, start_time: '19:30:00', end_time: '21:30:00', valid_from: '2026-01-01' },
        { class_id: cls2.id, day_of_week: 5, start_time: '19:30:00', end_time: '21:30:00', valid_from: '2026-01-01' }
      ]);
    }

    if (cls3?.id) {
      await supabaseServer.from('class_schedules').insert([
        { class_id: cls3.id, day_of_week: 0, start_time: '09:00:00', end_time: '11:00:00', valid_from: '2026-01-01' }
      ]);
    }

    const currentYearMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    await supabaseServer.from('users').update({
      full_name: 'Trợ Giảng Mẫu (Demo Candidate)',
      bank_brand: 'MBBank',
      bank_number: '999988886666',
      bank_owner: 'TRO GIANG DEMO',
      bank_branch: 'Hà Nội',
      extra_incomes: {
        [currentYearMonth]: [
          { label: 'Thưởng chuyên cần tháng ' + (new Date().getMonth() + 1), amount: 300000 },
          { label: 'Trợ cấp soạn đề thi', amount: 200000 }
        ]
      }
    }).eq('id', userId);
  } catch (err) {
    console.error('Lỗi khi auto-seed dữ liệu demo:', err);
  }
}

export async function POST(request: Request) {
  console.log('API /api/login called');

  try {
    const { email, password } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email hoặc tên đăng nhập là bắt buộc.' },
        { status: 400 }
      );
    }

    let targetEmail = (email || '').trim().toLowerCase();
    const isAdminMode = targetEmail === 'admin' || targetEmail === 'admin@speanut.com' || targetEmail === '111111@speanut.com';
    const isDemoMode = targetEmail === 'demo' || targetEmail === 'user' || targetEmail === 'demo@speanut.com' || targetEmail === 'user@speanut.com';

    let targetPassword = password;
    if (isAdminMode) {
      targetEmail = 'admin@speanut.com';
      targetPassword = password || '111111';
    } else if (isDemoMode) {
      targetEmail = 'demo@speanut.com';
      targetPassword = password || 'demo123456';
    }

    if (!targetPassword) {
      return NextResponse.json(
        { error: 'Vui lòng nhập mật khẩu.' },
        { status: 400 }
      );
    }

    // 1. Khởi tạo Supabase Server Client
    const supabaseServer = await createClient();

    // 2. Thử đăng nhập bằng Server Client
    let { data, error } = await supabaseServer.auth.signInWithPassword({
      email: targetEmail,
      password: targetPassword,
    });

    // Tự động tạo tài khoản admin nếu chưa tồn tại
    if (error && isAdminMode && (error.message.includes('Invalid login credentials') || error.message.toLowerCase().includes('invalid'))) {
      console.log('Admin user does not exist. Creating admin account...');
      const { data: signUpData, error: signUpError } = await supabaseServer.auth.signUp({
        email: targetEmail,
        password: '111111',
      });

      if (!signUpError && signUpData.user) {
        await supabaseServer.from('users').upsert([
          {
            id: signUpData.user.id,
            email: targetEmail,
            full_name: 'Admin SPeanut',
          }
        ]);

        const retryRes = await supabaseServer.auth.signInWithPassword({
          email: targetEmail,
          password: '111111',
        });
        data = retryRes.data;
        error = retryRes.error;
      }
    }

    // Tự động tạo và nạp dữ liệu cho tài khoản demo nếu chưa tồn tại
    if (error && isDemoMode && (error.message.includes('Invalid login credentials') || error.message.toLowerCase().includes('invalid'))) {
      console.log('Demo user does not exist. Creating demo account...');
      const { data: signUpData, error: signUpError } = await supabaseServer.auth.signUp({
        email: targetEmail,
        password: 'demo123456',
      });

      if (!signUpError && signUpData.user) {
        await supabaseServer.from('users').upsert([
          {
            id: signUpData.user.id,
            email: targetEmail,
            full_name: 'Trợ Giảng Mẫu (Demo Candidate)',
            bank_brand: 'MBBank',
            bank_number: '999988886666',
            bank_owner: 'TRO GIANG DEMO',
            bank_branch: 'Hà Nội'
          }
        ]);

        const retryRes = await supabaseServer.auth.signInWithPassword({
          email: targetEmail,
          password: 'demo123456',
        });
        data = retryRes.data;
        error = retryRes.error;

        if (data?.user?.id) {
          await seedDemoUserDataIfNeeded(supabaseServer, data.user.id);
        }
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

    // Đảm bảo dữ liệu demo luôn có lớp học đầy đủ
    if (isDemoMode && data?.user?.id) {
      await seedDemoUserDataIfNeeded(supabaseServer, data.user.id);
    }

    const redirectUrl = isAdminMode ? '/admin' : '/';

    return NextResponse.json({
      success: true,
      user: data.user,
      redirectUrl,
      role: isAdminMode ? 'admin' : 'user'
    }, { status: 200 });

  } catch (err: any) {
    console.error("Lỗi hệ thống tại API Login:", err);
    return NextResponse.json(
      { error: err.message || 'Lỗi hệ thống khi đăng nhập.' },
      { status: 500 }
    );
  }
}