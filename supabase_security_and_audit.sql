-- ============================================================
-- SPeanut: Nâng cấp bảo mật RLS & Tự động ghi nhật ký Audit Logs
-- Chạy script này trên Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- 1. BẬT RLS (ROW LEVEL SECURITY) CHO CÁC BẢNG DỮ LIỆU
-- ============================================================
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teaching_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. DỌN DẸP CÁC CHÍNH SÁCH CŨ (NẾU CÓ) ĐỂ TRÁNH LỖI TRÙNG LẶP
-- ============================================================
DROP POLICY IF EXISTS "Users can read own classes" ON public.classes;
DROP POLICY IF EXISTS "Users can insert own classes" ON public.classes;
DROP POLICY IF EXISTS "Users can update own classes" ON public.classes;
DROP POLICY IF EXISTS "Users can delete own classes" ON public.classes;
DROP POLICY IF EXISTS "Admin can read all classes" ON public.classes;

DROP POLICY IF EXISTS "Users can read own class schedules" ON public.class_schedules;
DROP POLICY IF EXISTS "Users can insert own class schedules" ON public.class_schedules;
DROP POLICY IF EXISTS "Users can update own class schedules" ON public.class_schedules;
DROP POLICY IF EXISTS "Users can delete own class schedules" ON public.class_schedules;
DROP POLICY IF EXISTS "Admin can read all class schedules" ON public.class_schedules;

DROP POLICY IF EXISTS "Users can read own teaching logs" ON public.teaching_logs;
DROP POLICY IF EXISTS "Users can insert own teaching logs" ON public.teaching_logs;
DROP POLICY IF EXISTS "Users can update own teaching logs" ON public.teaching_logs;
DROP POLICY IF EXISTS "Users can delete own teaching logs" ON public.teaching_logs;
DROP POLICY IF EXISTS "Admin can read all teaching logs" ON public.teaching_logs;

-- ============================================================
-- 3. CÁC CHÍNH SÁCH BẢO MẬT CHO BẢNG LỚP HỌC (Classes)
-- ============================================================
-- Giáo viên chỉ được xem lớp học của chính mình
CREATE POLICY "Users can read own classes" ON public.classes
  FOR SELECT USING (user_id = auth.uid());

-- Giáo viên chỉ được tạo lớp học cho chính mình
CREATE POLICY "Users can insert own classes" ON public.classes
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Giáo viên chỉ được chỉnh sửa lớp học của chính mình
CREATE POLICY "Users can update own classes" ON public.classes
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Giáo viên chỉ được xóa lớp học của chính mình
CREATE POLICY "Users can delete own classes" ON public.classes
  FOR DELETE USING (user_id = auth.uid());

-- Admin được quyền xem tất cả các lớp học
CREATE POLICY "Admin can read all classes" ON public.classes
  FOR SELECT USING (auth.email() IN ('admin@speanut.com', '111111@speanut.com'));


-- ============================================================
-- 4. CÁC CHÍNH SÁCH CHO BẢNG LỊCH CỐ ĐỊNH (Class Schedules)
-- ============================================================
-- Giáo viên được xem lịch học của các lớp do mình sở hữu
CREATE POLICY "Users can read own class schedules" ON public.class_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = class_schedules.class_id AND classes.user_id = auth.uid()
    )
  );

-- Giáo viên được thêm lịch học cho các lớp do mình sở hữu
CREATE POLICY "Users can insert own class schedules" ON public.class_schedules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = class_schedules.class_id AND classes.user_id = auth.uid()
    )
  );

-- Giáo viên được cập nhật lịch học của các lớp do mình sở hữu
CREATE POLICY "Users can update own class schedules" ON public.class_schedules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = class_schedules.class_id AND classes.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = class_schedules.class_id AND classes.user_id = auth.uid()
    )
  );

-- Giáo viên được xóa lịch học của các lớp do mình sở hữu
CREATE POLICY "Users can delete own class schedules" ON public.class_schedules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = class_schedules.class_id AND classes.user_id = auth.uid()
    )
  );

-- Admin được quyền xem tất cả các lịch cố định
CREATE POLICY "Admin can read all class schedules" ON public.class_schedules
  FOR SELECT USING (auth.email() IN ('admin@speanut.com', '111111@speanut.com'));


-- ============================================================
-- 5. CÁC CHÍNH SÁCH CHO BẢNG NHẬT KÝ DẠY (Teaching Logs)
-- ============================================================
-- Giáo viên được xem nhật ký dạy của các lớp do mình sở hữu
CREATE POLICY "Users can read own teaching logs" ON public.teaching_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = teaching_logs.class_id AND classes.user_id = auth.uid()
    )
  );

-- Giáo viên được thêm nhật ký dạy cho các lớp do mình sở hữu
CREATE POLICY "Users can insert own teaching logs" ON public.teaching_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = teaching_logs.class_id AND classes.user_id = auth.uid()
    )
  );

-- Giáo viên được cập nhật nhật ký dạy của các lớp do mình sở hữu
CREATE POLICY "Users can update own teaching logs" ON public.teaching_logs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = teaching_logs.class_id AND classes.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = teaching_logs.class_id AND classes.user_id = auth.uid()
    )
  );

-- Giáo viên được xóa nhật ký dạy của các lớp do mình sở hữu
CREATE POLICY "Users can delete own teaching logs" ON public.teaching_logs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = teaching_logs.class_id AND classes.user_id = auth.uid()
    )
  );

-- Admin được quyền xem tất cả các nhật ký dạy thực tế
CREATE POLICY "Admin can read all teaching logs" ON public.teaching_logs
  FOR SELECT USING (auth.email() IN ('admin@speanut.com', '111111@speanut.com'));


-- ============================================================
-- 6. TẠO BẢNG GHI NHẬT KÝ HOẠT ĐỘNG (Admin Audit Logs)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    admin_email VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    target_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    target_user_email VARCHAR(255) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kích hoạt bảo mật RLS cho bảng nhật ký hoạt động
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Chỉ có tài khoản Admin mới có quyền xem bảng nhật ký hoạt động này
DROP POLICY IF EXISTS "Admin can read audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admin can read audit logs" ON public.admin_audit_logs
  FOR SELECT USING (auth.email() IN ('admin@speanut.com', '111111@speanut.com'));


-- ============================================================
-- 7. TẠO TRIGGER TỰ ĐỘNG GHI NHẬT KÝ KHI ADMIN SỬA THƯỞNG/THÊM
-- ============================================================
CREATE OR REPLACE FUNCTION log_admin_extra_incomes_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Chỉ ghi nhận log khi trường extra_incomes thực sự bị thay đổi
  IF (OLD.extra_incomes IS DISTINCT FROM NEW.extra_incomes) THEN
    -- Chỉ ghi nhận log nếu người thực hiện thay đổi là Admin
    IF auth.email() IN ('admin@speanut.com', '111111@speanut.com') THEN
      INSERT INTO public.admin_audit_logs (
        admin_id,
        admin_email,
        action,
        target_user_id,
        target_user_email,
        old_value,
        new_value
      ) VALUES (
        auth.uid(),
        auth.email(),
        'UPDATE_EXTRA_INCOME',
        NEW.id,
        NEW.email,
        OLD.extra_incomes,
        NEW.extra_incomes
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gắn trigger vào bảng users
DROP TRIGGER IF EXISTS trigger_log_admin_extra_incomes_changes ON public.users;
CREATE TRIGGER trigger_log_admin_extra_incomes_changes
  AFTER UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION log_admin_extra_incomes_changes();


-- ============================================================
-- 8. LÀM MỚI CACHE API CỦA SUPABASE
-- ============================================================
NOTIFY pgrst, 'reload schema';
