// services/class.ts
import { createClient } from '@/lib/server'; 
// Danh sách các lớp 
export interface GroupedClassDisplay {
  id: number;
  name: string;
  short_name: string;
  rate_per_session: number;
  type: 'FIXED' | 'EXTRA';
  days?: string[]; 
  start_time?: string;
  end_time?: string;
  valid_from?: string;
}

// Form tạo lớp mới
export interface CreateClassInput {
  userId: string; 
  name: string;
  short_name: string;
  rate_per_session: number;
  type: 'FIXED' | 'EXTRA';
  selectedDays: number[];
  start_time: string;
  end_time: string;
  valid_from: string;
}

// Form thay đổi thông tin lớp
export interface ChangeScheduleInput {
  classId: number;
  userId: string; 
  editSelectedDays: number[];
  editValidFrom: string;
  editStartTime: string;
  editEndTime: string;
}

// Các thứ trong tuần
const daysOfWeekLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export const ClassService = {
  /**
   * 1. Lấy danh sách toàn bộ lớp học của ĐÚNG user đang đăng nhập
   */
  async fetchClasses(userId: string): Promise<GroupedClassDisplay[]> {
    const supabase = await createClient(); 

    const { data: classesData, error: classErr } = await supabase
      .from('classes')
      .select('*')
      .eq('user_id', userId) 
      .order('id', { ascending: false });

    if (classErr) throw classErr;
    if (!classesData || classesData.length === 0) return [];

    const { data: schedulesData, error: scheduleErr } = await supabase
      .from('class_schedules')
      .select('*')
      .is('valid_to', null);

    if (scheduleErr) throw scheduleErr;

   return (classesData || []).map((cls: any) => {
      if (cls.type === 'EXTRA') {
        return { 
          id: cls.id, 
          name: cls.name, 
          short_name: cls.short_name, 
          rate_per_session: cls.rate_per_session, 
          type: 'EXTRA' 
        };
      }
      // Thêm dấu ? sau s và cls
const classSchedules = (schedulesData || []).filter((s: any) => s?.class_id === cls?.id);
     const days = (classSchedules || []).map((s: any) => daysOfWeekLabels[s?.day_of_week]);
      
      return {
        id: cls.id,
        name: cls.name,
        short_name: cls.short_name,
        rate_per_session: cls.rate_per_session,
        type: 'FIXED',
        days: days,
        start_time: classSchedules[0]?.start_time?.slice(0, 5) || '18:00',
        end_time: classSchedules[0]?.end_time?.slice(0, 5) || '20:00',
        valid_from: classSchedules[0]?.valid_from
      };
    });
  },

  /**
   * 2. Tạo mới một lớp học
   */
  async createClass(input: CreateClassInput): Promise<void> {
    const supabase = await createClient(); // Khởi tạo Server Client

    const { data: newClass, error: classError } = await supabase
      .from('classes')
      .insert({ 
        user_id: input.userId, 
        name: input.name.trim(), 
        short_name: input.short_name.trim().toUpperCase(), 
        rate_per_session: Number(input.rate_per_session), 
        type: input.type 
      })
      .select()
      .single();

    if (classError) throw classError;

    if (input.type === 'FIXED' && newClass) {
      const rowsToInsert = input.selectedDays.map((day) => ({ 
        class_id: newClass.id, 
        day_of_week: day, 
        start_time: input.start_time, 
        end_time: input.end_time, 
        valid_from: input.valid_from, 
        valid_to: null 
      }));

      const { error: scheduleError } = await supabase
        .from('class_schedules')
        .insert(rowsToInsert);

      if (scheduleError) throw scheduleError;
    }
  },

  /**
   * 3. Thay đổi lịch dạy của lớp FIXED
   */
  async changeSchedule(input: ChangeScheduleInput): Promise<void> {
    const supabase = await createClient(); // Khởi tạo Server Client
    const { classId, userId, editSelectedDays, editValidFrom, editStartTime, editEndTime } = input;

    // Bước kiểm tra an toàn danh tính chủ sở hữu
    const { data: checkOwner, error: checkError } = await supabase
      .from('classes')
      .select('id')
      .eq('id', classId)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError || !checkOwner) {
      throw new Error("Bạn không có quyền thay đổi lịch của lớp học này!");
    }

    const previousDate = new Date(editValidFrom);
    previousDate.setDate(previousDate.getDate() - 1);
    const validToValue = previousDate.toISOString().split('T')[0];

    // Đóng hiệu lực lịch cũ
    const { error: closeError } = await supabase
      .from('class_schedules')
      .update({ valid_to: validToValue })
      .eq('class_id', classId)
      .is('valid_to', null);

    if (closeError) throw closeError;

    // Chuẩn bị các bản ghi lịch trình mới để đưa vào database
    const newSchedules = editSelectedDays.map(day => ({
      class_id: classId,
      day_of_week: day,
      start_time: editStartTime,
      end_time: editEndTime,
      valid_from: editValidFrom,
      valid_to: null
    }));

    const { error: insertError } = await supabase
      .from('class_schedules')
      .insert(newSchedules);

    if (insertError) throw insertError;
  },

  /**
   * 4. Xóa hoàn toàn một lớp học dựa trên Class ID và User ID
   */
  async deleteClass(classId: number, userId: string): Promise<void> {
    const supabase = await createClient(); 

    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', classId)
      .eq('user_id', userId);

    if (error) throw error;
  }
};