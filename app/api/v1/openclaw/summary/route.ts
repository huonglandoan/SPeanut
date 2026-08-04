import { NextResponse } from 'next/server';
import { verifyOpenClawAuth } from '@/lib/openclaw-auth';

const DAYS_VN = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

export async function GET(request: Request) {
  const auth = await verifyOpenClawAuth(request);
  if (!auth.authenticated || !auth.user || !auth.supabase) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { user, supabase } = auth;
    const now = new Date();

    // Adjust for GMT+7
    const localNow = new Date(now.getTime() + (7 * 60 - now.getTimezoneOffset()) * 60000);
    const todayStr = localNow.toISOString().split('T')[0];
    const currentDayOfWeek = localNow.getDay(); // 0 = Sunday, 1 = Monday...
    const currentMonth = localNow.getMonth() + 1;
    const currentYear = localNow.getFullYear();

    // 1. Fetch user classes
    const { data: classes } = await supabase
      .from('classes')
      .select('*')
      .eq('user_id', user.id);

    const classMap = new Map<number, any>((classes || []).map((c: any) => [c.id, c]));
    const classIds = (classes || []).map((c: any) => c.id);

    // 2. Today's schedule
    let todayClasses: any[] = [];
    if (classIds.length > 0) {
      const { data: schedules } = await supabase
        .from('class_schedules')
        .select('*')
        .in('class_id', classIds)
        .eq('day_of_week', currentDayOfWeek);

      // Check teaching logs for today
      const { data: todayLogs } = await supabase
        .from('teaching_logs')
        .select('*')
        .in('class_id', classIds)
        .eq('date', todayStr);

      const logMap = new Map((todayLogs || []).map((l: any) => [l.class_id, l]));

      todayClasses = (schedules || []).map((sched: any) => {
        const cls = classMap.get(sched.class_id);
        const log: any = logMap.get(sched.class_id);
        return {
          schedule_id: sched.id,
          class_id: sched.class_id,
          class_name: cls?.name || 'N/A',
          short_name: cls?.short_name || 'N/A',
          start_time: sched.start_time,
          end_time: sched.end_time,
          rate_per_session: Number(cls?.rate_per_session || 0),
          type: cls?.type || 'FIXED',
          status: log ? log.status : 'SCHEDULED', // SCHEDULED, ATTENDED, OFF, EXTRA
          note: log?.note || null,
        };
      });
    }

    // 3. Monthly stats
    const startOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const endOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

    let monthlyLogsCount = 0;
    let estimatedSalary = 0;

    if (classIds.length > 0) {
      const { data: monthLogs } = await supabase
        .from('teaching_logs')
        .select('*')
        .in('class_id', classIds)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth);

      (monthLogs || []).forEach((log: any) => {
        if (log.status === 'ATTENDED' || log.status === 'EXTRA') {
          monthlyLogsCount++;
          const cls = classMap.get(log.class_id);
          if (cls) {
            estimatedSalary += Number(cls.rate_per_session || 0);
          }
        }
      });
    }

    // Extra incomes total
    let extraIncomesTotal = 0;
    const extraIncomes = user.extra_incomes || {};
    Object.values(extraIncomes).forEach((item: any) => {
      if (item && item.amount) {
        extraIncomesTotal += Number(item.amount);
      }
    });

    return NextResponse.json({
      status: 'success',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
      },
      today: {
        date: todayStr,
        day_of_week: DAYS_VN[currentDayOfWeek],
        class_count: todayClasses.length,
        classes: todayClasses,
      },
      monthly_summary: {
        month: `${String(currentMonth).padStart(2, '0')}/${currentYear}`,
        attended_sessions: monthlyLogsCount,
        estimated_teaching_salary: estimatedSalary,
        extra_incomes_total: extraIncomesTotal,
        total_estimated_income: estimatedSalary + extraIncomesTotal,
      },
    }, { status: 200 });

  } catch (err: any) {
    console.error('Error at GET /api/v1/openclaw/summary:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
