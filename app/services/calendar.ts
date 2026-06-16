// services/calendar.ts
import { createClient } from '@/lib/server';

export interface CalendarEventData {
  id: number;
  class_id: number;
  name: string;
  short_name: string;
  rate_per_session: number;
  type: 'FIXED' | 'EXTRA';
  day_of_week: number;
  start_time: string;
  end_time: string;
  valid_from: string;
  valid_to: string | null;
}

export const CalendarService = {
  /**
   * Lấy toàn bộ lịch dạy của các lớp thuộc về user hiện tại
   */
  async fetchCalendarData(userId: string): Promise<CalendarEventData[]> {
    const supabase = await createClient();

    // 1. Lấy tất cả lớp học của user hiện tại
    const { data: classesData, error: classErr } = await supabase
      .from('classes')
      .select('id, name, short_name, rate_per_session, type')
      .eq('user_id', userId);

    if (classErr) throw classErr;
    if (!classesData || classesData.length === 0) return [];

    const classIds = classesData.map(c => c.id);

    // 2. Lấy toàn bộ lịch dạy của các lớp này
    const { data: schedulesData, error: scheduleErr } = await supabase
      .from('class_schedules')
      .select('id, class_id, day_of_week, start_time, end_time, valid_from, valid_to')
      .in('class_id', classIds);

    if (scheduleErr) throw scheduleErr;
    if (!schedulesData || schedulesData.length === 0) return [];

    // 3. Ghép kết quả
    const results: CalendarEventData[] = [];
    schedulesData.forEach((sched: any) => {
      const cls = classesData.find(c => c.id === sched.class_id);
      if (cls) {
        const scheduleType = sched.valid_from === sched.valid_to ? 'EXTRA' : cls.type;
        results.push({
          id: sched.id,
          class_id: sched.class_id,
          name: cls.name,
          short_name: cls.short_name,
          rate_per_session: cls.rate_per_session,
          type: scheduleType,
          day_of_week: sched.day_of_week,
          start_time: sched.start_time,
          end_time: sched.end_time,
          valid_from: sched.valid_from,
          valid_to: sched.valid_to
        });
      }
    });

    return results;
  }
};
