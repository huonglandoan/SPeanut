import { NextResponse } from 'next/server';
import { verifyOpenClawAuth } from '@/lib/openclaw-auth';

export async function POST(request: Request) {
  const auth = await verifyOpenClawAuth(request);
  if (!auth.authenticated || !auth.user || !auth.supabase) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { user, supabase } = auth;
    const body = await request.json();

    let { class_id, class_name, date, status, note, start_time, end_time } = body;

    // Default status to ATTENDED if not provided
    if (!status) {
      status = 'ATTENDED';
    }

    const validStatuses = ['ATTENDED', 'OFF', 'EXTRA'];
    if (!validStatuses.includes(status.toUpperCase())) {
      return NextResponse.json({
        error: `Trạng thái không hợp lệ. Chỉ chấp nhận các giá trị: ${validStatuses.join(', ')}`,
      }, { status: 400 });
    }
    status = status.toUpperCase();

    // Default date to today (GMT+7)
    if (!date) {
      const now = new Date();
      const localNow = new Date(now.getTime() + (7 * 60 - now.getTimezoneOffset()) * 60000);
      date = localNow.toISOString().split('T')[0];
    }

    // Resolve class_id if passed as class_name or short_name
    let targetClassId = Number(class_id);
    let targetClassName = '';

    const { data: userClasses } = await supabase
      .from('classes')
      .select('*')
      .eq('user_id', user.id);

    if (!userClasses || userClasses.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy lớp học nào thuộc về tài khoản này.' }, { status: 404 });
    }

    if (!targetClassId && (class_name || class_id)) {
      const searchStr = String(class_name || class_id).toLowerCase().trim();
      const matched = userClasses.find(
        (c: any) =>
          c.name.toLowerCase().includes(searchStr) ||
          c.short_name.toLowerCase() === searchStr
      );

      if (matched) {
        targetClassId = matched.id;
        targetClassName = matched.name;
      }
    } else {
      const matched = userClasses.find((c: any) => c.id === targetClassId);
      if (matched) {
        targetClassName = matched.name;
      }
    }

    if (!targetClassId) {
      return NextResponse.json({
        error: 'Không tìm thấy lớp học với tên hoặc class_id được cung cấp.',
        available_classes: userClasses.map((c: any) => ({ id: c.id, name: c.name, short_name: c.short_name })),
      }, { status: 400 });
    }

    // Check if log already exists for this class_id and date
    const { data: existingLogs } = await supabase
      .from('teaching_logs')
      .select('*')
      .eq('class_id', targetClassId)
      .eq('date', date);

    let resultData: any = null;

    if (existingLogs && existingLogs.length > 0) {
      // Update existing record
      const existingId = existingLogs[0].id;
      const { data, error } = await supabase
        .from('teaching_logs')
        .update({
          status,
          note: note !== undefined ? note : existingLogs[0].note,
          start_time: start_time || existingLogs[0].start_time,
          end_time: end_time || existingLogs[0].end_time,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingId)
        .select()
        .single();

      if (error) throw error;
      resultData = data;
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('teaching_logs')
        .insert({
          class_id: targetClassId,
          date,
          status,
          note: note || null,
          start_time: start_time || null,
          end_time: end_time || null,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      resultData = data;
    }

    const statusTextVN: Record<string, string> = {
      ATTENDED: 'Đã dạy',
      OFF: 'Báo nghỉ',
      EXTRA: 'Dạy thêm / Dạy bù',
    };

    return NextResponse.json({
      status: 'success',
      message: `Đã ghi nhận điểm danh lớp "${targetClassName}" cho ngày ${date} với trạng thái: ${statusTextVN[status] || status}.`,
      log: {
        id: resultData.id,
        class_id: targetClassId,
        class_name: targetClassName,
        date,
        status,
        note: resultData.note,
        updated_at: resultData.updated_at,
      },
    }, { status: 200 });

  } catch (err: any) {
    console.error('Error at POST /api/v1/openclaw/attendance:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
