import { NextResponse } from 'next/server';
import { verifyOpenClawAuth, handleCorsOptions, corsHeaders } from '@/lib/openclaw-auth';

const DAYS_VN = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

export async function OPTIONS() {
  return handleCorsOptions();
}

export async function GET(request: Request) {
  const auth = await verifyOpenClawAuth(request);
  if (!auth.authenticated || !auth.user || !auth.supabase) {
    return NextResponse.json({ error: auth.error }, { status: 401, headers: corsHeaders });
  }

  try {
    const { user, supabase } = auth;

    // 1. Fetch classes
    const { data: classes, error: classErr } = await supabase
      .from('classes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (classErr) throw classErr;

    const classIds = (classes || []).map((c: any) => c.id);

    // 2. Fetch class schedules
    let schedules: any[] = [];
    if (classIds.length > 0) {
      const { data: schedData } = await supabase
        .from('class_schedules')
        .select('*')
        .in('class_id', classIds);
      schedules = schedData || [];
    }

    const scheduleGroup = new Map<number, any[]>();
    schedules.forEach((s: any) => {
      if (!scheduleGroup.has(s.class_id)) {
        scheduleGroup.set(s.class_id, []);
      }
      scheduleGroup.get(s.class_id)?.push({
        id: s.id,
        day_of_week: s.day_of_week,
        day_name: DAYS_VN[s.day_of_week],
        start_time: s.start_time,
        end_time: s.end_time,
      });
    });

    const result = (classes || []).map((cls: any) => ({
      id: cls.id,
      name: cls.name,
      short_name: cls.short_name,
      rate_per_session: Number(cls.rate_per_session || 0),
      type: cls.type,
      schedules: scheduleGroup.get(cls.id) || [],
      created_at: cls.created_at,
    }));

    return NextResponse.json({
      status: 'success',
      count: result.length,
      classes: result,
    }, { status: 200, headers: corsHeaders });

  } catch (err: any) {
    console.error('Error at GET /api/v1/openclaw/classes:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: Request) {
  const auth = await verifyOpenClawAuth(request);
  if (!auth.authenticated || !auth.user || !auth.supabase) {
    return NextResponse.json({ error: auth.error }, { status: 401, headers: corsHeaders });
  }

  try {
    const { user, supabase } = auth;
    const body = await request.json();

    const { name, short_name, rate_per_session, type } = body;

    if (!name || !short_name || !rate_per_session) {
      return NextResponse.json({
        error: 'Thiếu thông tin bắt buộc. Cần có: name, short_name, rate_per_session.',
      }, { status: 400, headers: corsHeaders });
    }

    const classType = (type || 'FIXED').toUpperCase();

    const { data: newClass, error } = await supabase
      .from('classes')
      .insert({
        user_id: user.id,
        name,
        short_name,
        rate_per_session: Number(rate_per_session),
        type: classType,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      status: 'success',
      message: `Đã tạo thành công lớp học "${name}" (${short_name}).`,
      class: newClass,
    }, { status: 200, headers: corsHeaders });

  } catch (err: any) {
    console.error('Error at POST /api/v1/openclaw/classes:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500, headers: corsHeaders });
  }
}
