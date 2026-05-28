import { supabase } from '@/lib/supabase'

export interface ClassScheduleRow {
  id?: number;
  name: string;
  short_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  rate_per_session: number;
  created_at?: string;
}

export interface ClassList {
  name: string;
  short_name: string;
  days: string[];
  start_time: string;
  end_time: string;
  rate_per_session: number;
}
export interface CalendarEvent {
  title: string;
  shortName: string;
  start: string; // Định dạng ISO String "YYYY-MM-DDTHH:mm:ss"
  end: string;
  rate: number;
}

/**
 * HÀM 1: Lấy danh sách lớp và gộp các buổi học lại
 * Trả về dạng: Next.js (T2, T4, T6)
 */
export async function getClassList(): Promise<ClassList[]> {
  const { data, error: supabaseError } = await supabase
    .from('class_schedules') 
    .select('*')
    .order('day_of_week', { ascending: true }); 

  // Đã sửa: Check đúng biến lỗi của Supabase trả về
  if (supabaseError) throw supabaseError;
  if (!data) return [];

  const daysLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const map = new Map<string, ClassList>();

  data.forEach((item) => {
    const key = item.short_name; 
    if (!map.has(key)) {
      map.set(key, {
        name: item.name,
        short_name: item.short_name,
        days: [daysLabels[item.day_of_week]],
        start_time: item.start_time,
        end_time: item.end_time,
        rate_per_session: item.rate_per_session
      });
    } else {
      const existing = map.get(key)!;
      if (!existing.days.includes(daysLabels[item.day_of_week])) {
        existing.days.push(daysLabels[item.day_of_week]);
      }
    }
  });
  
  return Array.from(map.values());
}

/**
 * HÀM 2: Bung lịch tự động từ cấu hình cố định theo khoảng thời gian
 */
export async function getCalendarEventsService(startDate: string, endDate: string): Promise<CalendarEvent[]> {
  const { data: schedules, error: supabaseError } = await supabase
    .from('class_schedules')
    .select('*');

  if (supabaseError) throw supabaseError;
  if (!schedules) return [];

  const events: CalendarEvent[] = [];
  const startPeriod = new Date(startDate);
  const endPeriod = new Date(endDate);

  let currentLoopDate = new Date(startPeriod);
  while (currentLoopDate <= endPeriod) {
    const currentDayOfWeek = currentLoopDate.getDay(); 

    const activeSchedules = schedules.filter(s => s.day_of_week === currentDayOfWeek);

    for (const schedule of activeSchedules) {
      const [startHour, startMin] = schedule.start_time.split(":").map(Number);
      const [endHour, endMin] = schedule.end_time.split(":").map(Number);

      const eventStart = new Date(currentLoopDate);
      eventStart.setHours(startHour, startMin, 0, 0);

      const eventEnd = new Date(currentLoopDate);
      eventEnd.setHours(endHour, endMin, 0, 0);

      events.push({
        title: schedule.name,
        shortName: schedule.short_name,
        start: eventStart.toISOString(), 
        end: eventEnd.toISOString(),
        rate: schedule.rate_per_session
      });
    }

    currentLoopDate.setDate(currentLoopDate.getDate() + 1);
  }

  return events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/**
 * HÀM 3: Thêm mảng các lớp học mới
 */
export async function createClasses(rows: ClassScheduleRow[]) {
  const { data, error } = await supabase
    .from('class_schedules')
    .insert(rows)
    .select();

  if (error) throw error;
  return data;
}

/**
 * HÀM 4: Cập nhật thông tin một lớp học cũ bằng ID
 */
export async function updateClass(id: number, updatedData: Partial<ClassScheduleRow>) {
  const { data, error } = await supabase
    .from('class_schedules')
    .update(updatedData)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data;
}

export async function deleteClass(id: number) {
  const { error } = await supabase
    .from('class_schedules')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}