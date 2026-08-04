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

    // 2. Fetch teaching logs for month / date range
    let monthLogs: any[] = [];
    if (classIds.length > 0) {
      const { data: logs } = await supabase
        .from('teaching_logs')
        .select('*')
        .in('class_id', classIds)
        .gte('date', startDate)
        .lte('date', endDate);

      monthLogs = logs || [];
    }

    // 3. Group by class
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

    monthLogs.forEach((log: any) => {
      const item = classBreakdownMap.get(log.class_id);
      if (item) {
        if (log.status === 'ATTENDED') {
          item.attended_count++;
          item.total_amount += item.rate_per_session;
          totalTeachingSalary += item.rate_per_session;
        } else if (log.status === 'EXTRA') {
          item.extra_count++;
          item.total_amount += item.rate_per_session;
          totalTeachingSalary += item.rate_per_session;
        } else if (log.status === 'OFF') {
          item.off_count++;
        }
      }
    });

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
