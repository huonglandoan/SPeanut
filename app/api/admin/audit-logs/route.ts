import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseServer = await createClient();
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser();

    if (!user || (user.email !== 'admin@speanut.com' && user.email !== '111111@speanut.com')) {
      return NextResponse.json(
        { error: 'Unauthorized: Bạn không có quyền truy cập nhật ký hệ thống.' },
        { status: 401 }
      );
    }

    // Chỉ hiển thị lịch sử hoạt động trong vòng 2 tuần (14 ngày)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const { data, error } = await supabaseServer
      .from('admin_audit_logs')
      .select('*')
      .gte('created_at', fourteenDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Lỗi khi tải nhật ký hoạt động:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error('Lỗi hệ thống tại API GET /api/admin/audit-logs:', err);
    return NextResponse.json(
      { error: err.message || 'Lỗi hệ thống khi tải nhật ký.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, targetMonth, targetYear } = await request.json();

    if (action !== 'EXPORT_EXCEL') {
      return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from('admin_audit_logs')
      .insert({
        admin_id: user.id,
        admin_email: user.email,
        action: 'EXPORT_EXCEL',
        target_user_id: user.id,
        target_user_email: user.email!,
        new_value: { month: targetMonth, year: targetYear }
      });

    if (error) {
      console.error('Lỗi chèn log EXPORT_EXCEL:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: any) {
    console.error('Lỗi tại POST /api/admin/audit-logs:', err);
    return NextResponse.json(
      { error: err.message || 'Lỗi hệ thống.' },
      { status: 500 }
    );
  }
}
