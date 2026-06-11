import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export async function GET() {
  try {
    const supabaseServer = await createClient();

    const { data: { user }, error: userError } = await supabaseServer.auth.getUser();
    console.log('--- ADMIN API DEBUG ---');
    console.log('User:', user ? user.email : 'No user');
    console.log('User ID:', user ? user.id : 'N/A');
    console.log('User Error:', userError ? userError.message : 'None');

    // Gọi RPC get_admin_dashboard_data để lấy dữ liệu tổng hợp
    const { data, error } = await supabaseServer.rpc('get_admin_dashboard_data');

    if (error) {
      console.error('Lỗi RPC get_admin_dashboard_data:', error);
      
      // Nếu hàm RPC chưa tồn tại, gợi ý người dùng chạy migration
      if (error.code === 'PGRST501' || error.message.includes('does not exist')) {
        return NextResponse.json({
          error: 'Chưa khởi tạo hàm RPC trên Database. Vui lòng chạy file script supabase_migration_admin.sql trong SQL Editor của Supabase để tiếp tục.'
        }, { status: 500 });
      }
      
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error('Lỗi hệ thống tại API GET /api/admin/dashboard:', err);
    return NextResponse.json(
      { error: err.message || 'Lỗi hệ thống khi tải dữ liệu admin.' },
      { status: 500 }
    );
  }
}
