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

// Helper để tính ngày cuối cùng của tháng từ chuỗi YYYY-MM-DD
function getEndOfMonth(dateStr: string): string {
  const dateParts = dateStr.split('-');
  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10);
  const lastDayDate = new Date(year, month, 0);
  return `${lastDayDate.getFullYear()}-${String(lastDayDate.getMonth() + 1).padStart(2, "0")}-${String(lastDayDate.getDate()).padStart(2, "0")}`;
}

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
      .select('*');

    if (scheduleErr) throw scheduleErr;

    return (classesData || []).map((cls: any) => {
      // Lấy toàn bộ lịch học của lớp này (dùng chung cho cả FIXED và EXTRA)
      const allClassSchedules = (schedulesData || []).filter((s: any) => s?.class_id === cls?.id);
      
      if (cls.type === 'EXTRA') {
        // EXTRA cũng lấy thông tin lịch từ class_schedules
        const schedule = allClassSchedules[0];
        return { 
          id: cls.id, 
          name: cls.name, 
          short_name: cls.short_name, 
          rate_per_session: cls.rate_per_session, 
          type: 'EXTRA' as const,
          days: schedule ? [daysOfWeekLabels[schedule.day_of_week]] : undefined,
          start_time: schedule?.start_time?.slice(0, 5) || '18:00',
          end_time: schedule?.end_time?.slice(0, 5) || '20:00',
          valid_from: schedule?.valid_from
        };
      }

      // Tìm lịch dạy đang hoạt động (hôm nay nằm trong khoảng từ valid_from đến valid_to)
      const todayStr = new Date().toISOString().split('T')[0];
      let activeSchedules = allClassSchedules.filter((s: any) => {
        return s.valid_from <= todayStr && (s.valid_to === null || todayStr <= s.valid_to);
      });

      // Nếu không có lịch nào đang chạy hôm nay, lấy lịch mới nhất làm đại diện
      if (activeSchedules.length === 0 && allClassSchedules.length > 0) {
        const sorted = [...allClassSchedules].sort((a: any, b: any) => {
          const dateComp = b.valid_from.localeCompare(a.valid_from);
          if (dateComp !== 0) return dateComp;
          return b.id - a.id;
        });
        const latestValidFrom = sorted[0].valid_from;
        activeSchedules = sorted.filter((s: any) => s.valid_from === latestValidFrom);
      }

      // Sắp xếp thứ trong tuần theo thứ tự tăng dần từ T2 -> T3 -> ... -> T7 -> CN
      activeSchedules.sort((a: any, b: any) => {
        const valA = a.day_of_week === 0 ? 7 : a.day_of_week;
        const valB = b.day_of_week === 0 ? 7 : b.day_of_week;
        return valA - valB;
      });

      const days = (activeSchedules || []).map((s: any) => daysOfWeekLabels[s?.day_of_week]);
      
      return {
        id: cls.id,
        name: cls.name,
        short_name: cls.short_name,
        rate_per_session: cls.rate_per_session,
        type: 'FIXED' as const,
        days: days,
        start_time: activeSchedules[0]?.start_time?.slice(0, 5) || '18:00',
        end_time: activeSchedules[0]?.end_time?.slice(0, 5) || '20:00',
        valid_from: activeSchedules[0]?.valid_from
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
      const lastDayStr = getEndOfMonth(input.valid_from);
      const rowsToInsert = input.selectedDays.map((day) => ({ 
        class_id: newClass.id, 
        day_of_week: day, 
        start_time: input.start_time, 
        end_time: input.end_time, 
        valid_from: input.valid_from, 
        valid_to: lastDayStr 
      }));

      const { error: scheduleError } = await supabase
        .from('class_schedules')
        .insert(rowsToInsert);

      if (scheduleError) throw scheduleError;
    } else if (input.type === 'EXTRA' && newClass) {
      // Lớp EXTRA chỉ học đúng 1 buổi vào ngày valid_from
      const date = new Date(input.valid_from);
      const dayOfWeek = date.getUTCDay(); // 0 = CN, 1 = T2, ..., 6 = T7

      const { error: scheduleError } = await supabase
        .from('class_schedules')
        .insert({ 
          class_id: newClass.id, 
          day_of_week: dayOfWeek, 
          start_time: input.start_time || '18:00', 
          end_time: input.end_time || '20:00', 
          valid_from: input.valid_from, 
          valid_to: input.valid_from 
        });

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

    // Xóa toàn bộ lịch cũ của lớp này trong database để cập nhật trực tiếp lịch mới
    const { error: deleteError } = await supabase
      .from('class_schedules')
      .delete()
      .eq('class_id', classId);

    if (deleteError) throw deleteError;

    // Chuẩn bị các bản ghi lịch trình mới để đưa vào database
    const lastDayStr = getEndOfMonth(editValidFrom);
    const newSchedules = editSelectedDays.map(day => ({
      class_id: classId,
      day_of_week: day,
      start_time: editStartTime,
      end_time: editEndTime,
      valid_from: editValidFrom,
      valid_to: lastDayStr
    }));

    const { error: insertError } = await supabase
      .from('class_schedules')
      .insert(newSchedules);

    if (insertError) throw insertError;
  },

  /**
   * Cập nhật thông tin chi tiết lớp học (tên, thù lao)
   */
  async updateClassDetails(input: { classId: number; userId: string; name?: string; rate_per_session?: number }): Promise<void> {
    const supabase = await createClient();
    const { classId, userId, name, rate_per_session } = input;

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (rate_per_session !== undefined) updateData.rate_per_session = Number(rate_per_session);

    if (Object.keys(updateData).length === 0) return;

    const { error } = await supabase
      .from('classes')
      .update(updateData)
      .eq('id', classId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * Tách lớp học để tăng/giảm thù lao từ một ngày hiệu lực nhất định
   */
  async splitClassRate(input: { classId: number; userId: string; rate_per_session: number; effectiveDate: string }): Promise<void> {
    const supabase = await createClient();
    const { classId, userId, rate_per_session, effectiveDate } = input;

    // 1. Lấy thông tin lớp học hiện tại
    const { data: cls, error: classErr } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .eq('user_id', userId)
      .single();

    if (classErr || !cls) {
      throw new Error("Không tìm thấy lớp học hoặc bạn không có quyền chỉnh sửa.");
    }

    // 2. Lấy danh sách lịch học của lớp hiện tại
    const { data: schedules, error: scheduleErr } = await supabase
      .from('class_schedules')
      .select('*')
      .eq('class_id', classId);

    if (scheduleErr || !schedules || schedules.length === 0) {
      // Nếu không có lịch học nào, chỉ cần cập nhật thù lao trực tiếp
      await this.updateClassDetails({ classId, userId, rate_per_session });
      return;
    }

    // Tìm valid_from nhỏ nhất của các lịch học hiện tại
    const minValidFrom = schedules.reduce((min, s) => s.valid_from < min ? s.valid_from : min, schedules[0].valid_from);

    // Nếu ngày áp dụng mới nhỏ hơn hoặc bằng ngày bắt đầu của lớp học, cập nhật trực tiếp thù lao
    if (effectiveDate <= minValidFrom) {
      await this.updateClassDetails({ classId, userId, rate_per_session });
      return;
    }

    // 3. Tính ngày trước ngày hiệu lực: effectiveDate - 1 ngày
    const effDate = new Date(effectiveDate);
    effDate.setDate(effDate.getDate() - 1);
    const dayBeforeStr = effDate.toISOString().split('T')[0];

    // 4. Tạo một lớp học mới làm bản sao
    const { data: newClass, error: newClassErr } = await supabase
      .from('classes')
      .insert({
        user_id: userId,
        name: cls.name,
        short_name: cls.short_name,
        rate_per_session: Number(rate_per_session),
        type: cls.type
      })
      .select()
      .single();

    if (newClassErr || !newClass) {
      throw newClassErr ?? new Error("Không thể tạo lớp học bản sao để tăng lương.");
    }

    // 5. Xử lý lịch trình cũ và tạo lịch trình mới cho lớp mới
    const newSchedulesToInsert = [];
    
    for (const s of schedules) {
      if (s.valid_from < effectiveDate) {
        // Cập nhật lịch cũ kết thúc trước ngày hiệu lực
        const { error: updateSchErr } = await supabase
          .from('class_schedules')
          .update({ valid_to: dayBeforeStr })
          .eq('id', s.id);
        if (updateSchErr) throw updateSchErr;

        // Tạo bản ghi mới cho lớp mới bắt đầu từ ngày hiệu lực
        newSchedulesToInsert.push({
          class_id: newClass.id,
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
          valid_from: effectiveDate,
          valid_to: s.valid_to
        });
      } else {
        // Lịch cũ này bắt đầu sau/tại ngày hiệu lực -> Chuyển thẳng sang lớp mới
        const { error: moveSchErr } = await supabase
          .from('class_schedules')
          .update({ class_id: newClass.id })
          .eq('id', s.id);
        if (moveSchErr) throw moveSchErr;
      }
    }

    if (newSchedulesToInsert.length > 0) {
      const { error: insertErr } = await supabase
        .from('class_schedules')
        .insert(newSchedulesToInsert);
      if (insertErr) throw insertErr;
    }
  },

  /**
   * 4. Lặp lại lịch dạy của lớp FIXED sang tháng tiếp theo bắt đầu từ ngày 1
   *    → Tạo lớp MỚI (bản sao độc lập) để xóa tháng mới không ảnh hưởng tháng cũ
   */
  async repeatClassForNextMonth(classId: number, userId: string): Promise<string> {
    const supabase = await createClient();

    // Xác nhận chủ sở hữu lớp học
    const { data: classData, error: classErr } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .eq('user_id', userId)
      .maybeSingle();

    if (classErr || !classData) {
      throw new Error("Bạn không có quyền chỉnh sửa lớp học này!");
    }

    // Lấy toàn bộ lịch dạy của lớp học này
    const { data: schedules, error: scheduleErr } = await supabase
      .from('class_schedules')
      .select('*')
      .eq('class_id', classId);

    if (scheduleErr) throw scheduleErr;
    if (!schedules || schedules.length === 0) {
      throw new Error("Lớp học này chưa có lịch dạy để lặp lại!");
    }

    // Tìm lịch mới nhất (valid_from lớn nhất) để làm mốc tính tháng tiếp theo
    const sorted = [...schedules].sort((a: any, b: any) => b.valid_from.localeCompare(a.valid_from));
    const latestValidFrom = sorted[0].valid_from; // Ví dụ: "2026-04-01"

    const dateParts = latestValidFrom.split('-');
    let year = parseInt(dateParts[0], 10);
    let month = parseInt(dateParts[1], 10);

    // Tính tháng tiếp theo
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }

    const nextMonthStr = String(month).padStart(2, '0');
    const newValidFrom = `${year}-${nextMonthStr}-01`;
    const newValidTo = getEndOfMonth(newValidFrom);

    // Lấy các lịch dạy thuộc cùng chu kỳ mới nhất
    const activePeriodSchedules = schedules.filter(s => s.valid_from === latestValidFrom);

    // -----------------------------------------------------------------------
    // TẠO LỚP MỚI (bản sao độc lập) thay vì thêm lịch vào lớp cũ
    // → Khi xóa bản sao KHÔNG ảnh hưởng lớp gốc và ngược lại
    // -----------------------------------------------------------------------
    const { data: newClass, error: newClassErr } = await supabase
      .from('classes')
      .insert({
        user_id: userId,
        name: classData.name,
        short_name: classData.short_name,
        rate_per_session: classData.rate_per_session,
        type: classData.type,
      })
      .select()
      .single();

    if (newClassErr || !newClass) throw newClassErr ?? new Error("Không thể tạo lớp bản sao.");

    // Lưu lịch dạy mới gắn vào lớp BẢN SAO (không chạm lớp gốc)
    const rowsToInsert = activePeriodSchedules.map((s) => ({
      class_id: newClass.id,   // ← ID lớp MỚI, không phải lớp cũ
      day_of_week: s.day_of_week,
      start_time: s.start_time,
      end_time: s.end_time,
      valid_from: newValidFrom,
      valid_to: newValidTo
    }));

    const { error: insertError } = await supabase
      .from('class_schedules')
      .insert(rowsToInsert);

    if (insertError) throw insertError;

    return `${month}/${year}`;
  },

  /**
   * Thêm lịch dạy bổ trợ (EXTRA) cho lớp học có sẵn
   */
  async addExtraSession(input: { classId: number; userId: string; date: string; start_time: string; end_time: string }): Promise<void> {
    const supabase = await createClient();
    const { classId, userId, date, start_time, end_time } = input;

    // Xác nhận quyền sở hữu lớp học
    const { data: cls, error: classErr } = await supabase
      .from('classes')
      .select('id')
      .eq('id', classId)
      .eq('user_id', userId)
      .maybeSingle();

    if (classErr || !cls) {
      throw new Error("Không tìm thấy lớp học hoặc bạn không có quyền thêm lịch dạy.");
    }

    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay(); // 0 = CN, 1 = T2, ..., 6 = T7

    const { error: scheduleError } = await supabase
      .from('class_schedules')
      .insert({ 
        class_id: classId, 
        day_of_week: dayOfWeek, 
        start_time: start_time, 
        end_time: end_time, 
        valid_from: date, 
        valid_to: date 
      });

    if (scheduleError) throw scheduleError;
  },

  /**
   * 5. Xóa hoàn toàn một lớp học dựa trên Class ID và User ID
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