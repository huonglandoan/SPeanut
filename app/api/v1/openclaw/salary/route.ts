import { NextResponse } from 'next/server';
import { verifyOpenClawAuth, handleCorsOptions, corsHeaders } from '@/lib/openclaw-auth';

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

    let startDate = searchParams.get('startDate');
    let endDate = searchParams.get('endDate');
    let periodLabel = '';

    if (startDate && endDate) {
      periodLabel = `Từ ${startDate} đến ${endDate}`;
    } else {
      const monthParam = searchParams.get('month') ? Number(searchParams.get('month')) : localNow.getMonth() + 1;
      const yearParam = searchParams.get('year') ? Number(searchParams.get('year')) : localNow.getFullYear();
      startDate = `${yearParam}-${String(monthParam).padStart(2, '0')}-01`;
      endDate = new Date(yearParam, monthParam, 0).toISOString().split('T')[0];
      periodLabel = `Tháng ${String(monthParam).padStart(2, '0')}/${yearParam}`;
    }

    // 1. Fetch user classes
    const { data: classes } = await supabase
      .from('classes')
      .select('*')
      .eq('user_id', user.id);

    const classMap = new Map((classes || []).map((c: any) => [c.id, c]));
    const classIds = (classes || []).map((c: any) => c.id);

    // 2. Fetch class schedules & teaching logs
    let schedules: any[] = [];
    let logs: any[] = [];

    if (classIds.length > 0) {
      const { data: schedData } = await supabase
        .from('class_schedules')
        .select('*')
        .in('class_id', classIds);
      schedules = schedData || [];

      const { data: logData } = await supabase
        .from('teaching_logs')
        .select('*')
        .in('class_id', classIds)
        .gte('date', startDate)
        .lte('date', endDate);
      logs = logData || [];
    }

    const cancelledSessions: Record<string, boolean> = user.cancelled_sessions || {};

    const logMap = new Map<string, any>();
    logs.forEach((l: any) => {
      logMap.set(`${l.class_id}_${l.date}`, l);
    });

    // 3. Group by class & calculate day by day from startDate to endDate
    const classBreakdownMap = new Map<number, {
      class_id: number;
      name: string;
      short_name: string;
      rate_per_session: number;
      attended_count: number;
      off_count: number;
      extra_count: number;
      total_amount: number;
    }>();

    (classes || []).forEach((cls: any) => {
      classBreakdownMap.set(cls.id, {
        class_id: cls.id,
        name: cls.name,
        short_name: cls.short_name,
        rate_per_session: Number(cls.rate_per_session || 0),
        attended_count: 0,
        off_count: 0,
        extra_count: 0,
        total_amount: 0,
      });
    });

    let totalTeachingSalary = 0;

    const currDate = new Date(startDate);
    const stopDate = new Date(endDate);

    while (currDate <= stopDate) {
      const cellDateStr = currDate.toISOString().split('T')[0];
      const dow = currDate.getDay();

      const activeSchedules = schedules.filter((s: any) =>
        s.day_of_week === dow &&
        (s.valid_from ? s.valid_from <= cellDateStr : true) &&
        (s.valid_to ? cellDateStr <= s.valid_to : true)
      );

      activeSchedules.forEach((s: any) => {
        const cancelKey = `${s.class_id}_${cellDateStr}`;
        const log = logMap.get(cancelKey);
        const isCancelled = !!cancelledSessions[cancelKey] || log?.status === 'OFF';

        const item = classBreakdownMap.get(s.class_id);
        if (item) {
          if (isCancelled) {
            item.off_count += 1;
          } else {
            item.attended_count += 1;
            item.total_amount += item.rate_per_session;
            totalTeachingSalary += item.rate_per_session;
          }
        }
      });

      // Extra logs for this date
      logs.forEach((log: any) => {
        if (log.date === cellDateStr && log.status === 'EXTRA') {
          const item = classBreakdownMap.get(log.class_id);
          if (item) {
            item.extra_count += 1;
            item.total_amount += item.rate_per_session;
            totalTeachingSalary += item.rate_per_session;
          }
        }
      });

      currDate.setDate(currDate.getDate() + 1);
    }

    const classesBreakdown = Array.from(classBreakdownMap.values());

    // 4. Calculate Extra Incomes
    let extraIncomesTotal = 0;
    const extraIncomesList: any[] = [];
    const userExtraIncomes = user.extra_incomes || {};

    Object.entries(userExtraIncomes).forEach(([key, value]: [string, any]) => {
      if (value && typeof value === 'object') {
        const amt = Number(value.amount || 0);
        extraIncomesTotal += amt;
        extraIncomesList.push({
          id: key,
          title: value.title || value.name || key,
          amount: amt,
          note: value.note || null,
        });
      } else if (typeof value === 'number') {
        extraIncomesTotal += value;
        extraIncomesList.push({
          id: key,
          title: key,
          amount: value,
        });
      }
    });

    return NextResponse.json({
      status: 'success',
      period: periodLabel,
      start_date: startDate,
      end_date: endDate,
      user_payment_info: {
        full_name: user.full_name,
        bank_brand: user.bank_brand || 'Chưa cập nhật',
        bank_number: user.bank_number || 'Chưa cập nhật',
        bank_owner: user.bank_owner || 'Chưa cập nhật',
      },
      classes_breakdown: classesBreakdown,
      extra_incomes: extraIncomesList,
      totals: {
        total_teaching_sessions: classesBreakdown.reduce((sum, c) => sum + c.attended_count + c.extra_count, 0),
        total_teaching_salary: totalTeachingSalary,
        total_extra_incomes: extraIncomesTotal,
        grand_total_income: totalTeachingSalary + extraIncomesTotal,
      },
    }, { status: 200, headers: corsHeaders });

  } catch (err: any) {
    console.error('Error at GET /api/v1/openclaw/salary:', err);
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
    const { name, title, amount, month, year } = body;

    const itemTitle = name || title;
    const numAmount = Number(amount);

    if (!itemTitle || !numAmount) {
      return NextResponse.json({
        error: 'Cần truyền name/title và amount (số tiền).',
      }, { status: 400, headers: corsHeaders });
    }

    const now = new Date();
    const targetMonth = month ? Number(month) : now.getMonth() + 1;
    const targetYear = year ? Number(year) : now.getFullYear();
    const dbKey = `${targetYear}_${targetMonth}`;

    const currentExtra = user.extra_incomes || {};
    const monthList = Array.isArray(currentExtra[dbKey]) ? currentExtra[dbKey] : [];

    const newItem = {
      id: Date.now().toString(),
      name: itemTitle,
      amount: numAmount,
    };

    const updatedMonthList = [...monthList, newItem];
    const updatedExtraIncomes = {
      ...currentExtra,
      [dbKey]: updatedMonthList,
    };

    if (user.id && user.id !== 'user_openclaw_active' && user.id !== 'user_openclaw_default') {
      await supabase
        .from('users')
        .update({ extra_incomes: updatedExtraIncomes })
        .eq('id', user.id);
    }

    return NextResponse.json({
      status: 'success',
      message: `Đã ghi nhận khoản thu phụ "${itemTitle}" (${numAmount.toLocaleString('vi-VN')} VNĐ) vào Tháng ${targetMonth}/${targetYear}.`,
      item: newItem,
      month: targetMonth,
      year: targetYear,
    }, { status: 200, headers: corsHeaders });

  } catch (err: any) {
    console.error('Error at POST /api/v1/openclaw/salary:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500, headers: corsHeaders });
  }
}
