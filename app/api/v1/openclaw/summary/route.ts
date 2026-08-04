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

    // 2. Fetch class schedules
    let schedules: any[] = [];
    if (classIds.length > 0) {
      const { data: schedData } = await supabase
        .from('class_schedules')
        .select('*')
        .in('class_id', classIds);
      schedules = schedData || [];
    }

    const cancelledSessions: Record<string, boolean> = user.cancelled_sessions || {};

    // Today's classes
    const todaySchedules = schedules.filter((s: any) =>
      s.day_of_week === currentDayOfWeek &&
      (s.valid_from ? s.valid_from <= todayStr : true) &&
      (s.valid_to ? todayStr <= s.valid_to : true)
    );

    const todayClasses = todaySchedules.map((sched: any) => {
      const cls = classMap.get(sched.class_id);
      const cancelKey = `${sched.class_id}_${todayStr}`;
      const isCancelled = !!cancelledSessions[cancelKey];

      return {
        schedule_id: sched.id,
        class_id: sched.class_id,
        class_name: cls?.name || 'N/A',
        short_name: cls?.short_name || 'N/A',
        start_time: sched.start_time,
        end_time: sched.end_time,
        rate_per_session: Number(cls?.rate_per_session || 0),
        type: cls?.type || 'FIXED',
        status: isCancelled ? 'OFF' : 'SCHEDULED', // OFF (báo nghỉ), SCHEDULED (có lịch dạy)
        is_cancelled: isCancelled,
      };
    });

    // 3. Monthly stats (from 1st of month to end of month)
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    let monthlyLogsCount = 0;
    let estimatedSalary = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const cellDateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dateObj = new Date(currentYear, currentMonth - 1, d);
      const dow = dateObj.getDay();

      const activeSchedules = schedules.filter((s: any) =>
        s.day_of_week === dow &&
        (s.valid_from ? s.valid_from <= cellDateStr : true) &&
        (s.valid_to ? cellDateStr <= s.valid_to : true)
      );

      activeSchedules.forEach((s: any) => {
        const cancelKey = `${s.class_id}_${cellDateStr}`;
        const isCancelled = !!cancelledSessions[cancelKey];

        if (!isCancelled) {
          monthlyLogsCount++;
          const cls = classMap.get(s.class_id);
          if (cls) {
            estimatedSalary += Number(cls.rate_per_session || 0);
          }
        }
      });
    }

    // Extra incomes total for current month
    let extraIncomesTotal = 0;
    const dbKey = `${currentYear}_${currentMonth}`;
    const userExtraIncomes = user.extra_incomes || {};
    const monthExtra = userExtraIncomes[dbKey];

    if (Array.isArray(monthExtra)) {
      monthExtra.forEach((item: any) => {
        if (item && item.amount) {
          extraIncomesTotal += Number(item.amount);
        }
      });
    } else {
      Object.values(userExtraIncomes).forEach((item: any) => {
        if (item && typeof item === 'object' && item.amount) {
          extraIncomesTotal += Number(item.amount);
        } else if (typeof item === 'number') {
          extraIncomesTotal += item;
        }
      });
    }

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
    }, { status: 200, headers: corsHeaders });

  } catch (err: any) {
    console.error('Error at GET /api/v1/openclaw/summary:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500, headers: corsHeaders });
  }
}
