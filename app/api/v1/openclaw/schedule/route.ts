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
    const { searchParams } = new URL(request.url);

    const now = new Date();
    const localNow = new Date(now.getTime() + (7 * 60 - now.getTimezoneOffset()) * 60000);

    // Default to current week if dates not specified
    let startDateParam = searchParams.get('startDate');
    let endDateParam = searchParams.get('endDate');

    if (!startDateParam || !endDateParam) {
      const day = localNow.getDay();
      const diffToMonday = localNow.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(localNow.setDate(diffToMonday));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      startDateParam = monday.toISOString().split('T')[0];
      endDateParam = sunday.toISOString().split('T')[0];
    }

    // 1. Fetch classes
    const { data: classes } = await supabase
      .from('classes')
      .select('*')
      .eq('user_id', user.id);

    const classMap = new Map<number, any>((classes || []).map((c: any) => [c.id, c]));
    const classIds = (classes || []).map((c: any) => c.id);

    if (classIds.length === 0) {
      return NextResponse.json({
        status: 'success',
        start_date: startDateParam,
        end_date: endDateParam,
        schedule: [],
      }, { status: 200, headers: corsHeaders });
    }

    // 2. Fetch class schedules & teaching logs
    const { data: schedules } = await supabase
      .from('class_schedules')
      .select('*')
      .in('class_id', classIds);

    const { data: teachingLogs } = await supabase
      .from('teaching_logs')
      .select('*')
      .in('class_id', classIds)
      .gte('date', startDateParam)
      .lte('date', endDateParam);

    const logsMap = new Map();
    (teachingLogs || []).forEach((log: any) => {
      const key = `${log.class_id}_${log.date}`;
      logsMap.set(key, log);
    });

    // 3. Build day-by-day calendar
    const scheduleByDate: any[] = [];
    const currDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    while (currDate <= endDate) {
      const dateStr = currDate.toISOString().split('T')[0];
      const dayOfWeek = currDate.getDay();

      // Find matching schedules for dayOfWeek
      const daySchedules = (schedules || []).filter((s: any) => s.day_of_week === dayOfWeek);

      const items = daySchedules.map((sched: any) => {
        const cls = classMap.get(sched.class_id);
        const logKey = `${sched.class_id}_${dateStr}`;
        const log = logsMap.get(logKey);

        return {
          class_id: sched.class_id,
          class_name: cls?.name || 'N/A',
          short_name: cls?.short_name || 'N/A',
          type: cls?.type || 'FIXED',
          rate_per_session: Number(cls?.rate_per_session || 0),
          start_time: sched.start_time,
          end_time: sched.end_time,
          status: log ? log.status : 'SCHEDULED', // SCHEDULED, ATTENDED, OFF, EXTRA
          note: log?.note || null,
        };
      });

      // Also check for EXTRA sessions logged on this date not in fixed schedule
      (teachingLogs || []).forEach((log: any) => {
        if (log.date === dateStr && log.status === 'EXTRA') {
          const exists = items.some((i: any) => i.class_id === log.class_id);
          if (!exists) {
            const cls = classMap.get(log.class_id);
            items.push({
              class_id: log.class_id,
              class_name: cls?.name || 'N/A',
              short_name: cls?.short_name || 'N/A',
              type: 'EXTRA',
              rate_per_session: Number(cls?.rate_per_session || 0),
              start_time: log.start_time || 'N/A',
              end_time: log.end_time || 'N/A',
              status: 'EXTRA',
              note: log.note || null,
            });
          }
        }
      });

      if (items.length > 0) {
        scheduleByDate.push({
          date: dateStr,
          day_of_week: DAYS_VN[dayOfWeek],
          classes: items,
        });
      }

      currDate.setDate(currDate.getDate() + 1);
    }

    return NextResponse.json({
      status: 'success',
      range: {
        start_date: startDateParam,
        end_date: endDateParam,
      },
      schedule: scheduleByDate,
    }, { status: 200, headers: corsHeaders });

  } catch (err: any) {
    console.error('Error at GET /api/v1/openclaw/schedule:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500, headers: corsHeaders });
  }
}
