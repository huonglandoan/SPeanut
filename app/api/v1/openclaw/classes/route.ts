import { NextResponse } from 'next/server';
import { verifyOpenClawAuth, handleCorsOptions, corsHeaders } from '@/lib/openclaw-auth';

const DAYS_VN = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

function parseDayOfWeek(input: any): number {
  if (typeof input === 'number' && input >= 0 && input <= 6) return input;
  const str = String(input || '').toLowerCase().trim();
  if (str.includes('3') || str.includes('ba')) return 2;
  if (str.includes('4') || str.includes('tư') || str.includes('tu')) return 3;
  if (str.includes('5') || str.includes('năm') || str.includes('nam')) return 4;
  if (str.includes('6') || str.includes('sáu') || str.includes('sau')) return 5;
  if (str.includes('7') || str.includes('bảy') || str.includes('bay')) return 6;
  if (str.includes('2') || str.includes('hai')) return 1;
  if (str.includes('cn') || str.includes('nhật') || str.includes('nhat') || str === '0') return 0;
  return 1;
}

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

    // Parse & insert class_schedules if provided
    const insertedSchedules: any[] = [];
    const validFromDate = body.valid_from || body.startDate || new Date().toISOString().split('T')[0];
    const startTimeStr = body.start_time || '18:00';
    const endTimeStr = body.end_time || '19:30';

    let rawDays: any[] = [];
    if (Array.isArray(body.schedules)) {
      body.schedules.forEach((s: any) => {
        if (typeof s === 'object' && s !== null) {
          rawDays.push({
            day_of_week: parseDayOfWeek(s.day_of_week),
            start_time: s.start_time || startTimeStr,
            end_time: s.end_time || endTimeStr,
            valid_from: s.valid_from || validFromDate,
          });
        }
      });
    } else if (Array.isArray(body.days_of_week)) {
      rawDays = body.days_of_week.map((d: any) => ({
        day_of_week: parseDayOfWeek(d),
        start_time: startTimeStr,
        end_time: endTimeStr,
        valid_from: validFromDate,
      }));
    } else if (body.days) {
      const daysArr = Array.isArray(body.days) ? body.days : String(body.days).split(/[,;]/);
      rawDays = daysArr.map((d: any) => ({
        day_of_week: parseDayOfWeek(d),
        start_time: startTimeStr,
        end_time: endTimeStr,
        valid_from: validFromDate,
      }));
    }

    if (rawDays.length > 0 && newClass) {
      const scheduleInserts = rawDays.map((rd: any) => ({
        class_id: newClass.id,
        day_of_week: rd.day_of_week,
        start_time: rd.start_time,
        end_time: rd.end_time,
        valid_from: rd.valid_from,
        valid_to: null,
      }));

      const { data: schedData, error: schedErr } = await supabase
        .from('class_schedules')
        .insert(scheduleInserts)
        .select();

      if (!schedErr && schedData) {
        insertedSchedules.push(...schedData);
      }
    }

    return NextResponse.json({
      status: 'success',
      message: `Đã tạo thành công lớp học "${name}" (${short_name}) với ${insertedSchedules.length} buổi dạy trong thời khóa biểu.`,
      class: newClass,
      schedules: insertedSchedules,
    }, { status: 200, headers: corsHeaders });

  } catch (err: any) {
    console.error('Error at POST /api/v1/openclaw/classes:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500, headers: corsHeaders });
  }
}
