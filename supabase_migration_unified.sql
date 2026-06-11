-- ============================================================================
-- SPeanut: Unified Database Setup Script (Bảng biểu, RLS, Audit Logs, RPC & Tài khoản mẫu)
-- Chạy toàn bộ file này một lần duy nhất trong Supabase SQL Editor để cài đặt từ đầu.
-- ============================================================================

-- 1. Kích hoạt pgcrypto để dùng hàm mã hóa mật khẩu (phải chạy đầu tiên)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- XOÁ CÁC BẢNG CŨ (NẾU CÓ) ĐỂ TRÁNH LỖI TRÙNG LẶP
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_log_admin_extra_incomes_changes ON public.users CASCADE;
DROP FUNCTION IF EXISTS log_admin_extra_incomes_changes() CASCADE;
DROP TRIGGER IF EXISTS trigger_log_classes_changes ON public.classes CASCADE;
DROP FUNCTION IF EXISTS log_classes_changes() CASCADE;
DROP TRIGGER IF EXISTS trigger_log_users_changes ON public.users CASCADE;
DROP FUNCTION IF EXISTS log_users_changes() CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_dashboard_data() CASCADE;

DROP TABLE IF EXISTS public.admin_audit_logs CASCADE;
DROP TABLE IF EXISTS public.teaching_logs CASCADE;
DROP TABLE IF EXISTS public.class_schedules CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ============================================================================
-- 1. BẢNG NGƯỜI DÙNG (Users) - Bao gồm các trường Profile & Thưởng
-- ============================================================================
CREATE TABLE public.users (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email varchar(255) UNIQUE NOT NULL,
    full_name varchar(108) NOT NULL,
    avatar TEXT,
    bank_brand VARCHAR DEFAULT '',
    bank_number VARCHAR DEFAULT '',
    bank_owner VARCHAR DEFAULT '',
    bank_branch VARCHAR DEFAULT '',
    qr_code TEXT,
    extra_incomes JSONB DEFAULT '{}'::jsonb,
    cancelled_sessions JSONB DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    last_active_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- 2. BẢNG LỚP HỌC (Classes)
-- ============================================================================
CREATE TABLE public.classes (
    id SERIAL PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL, -- Liên kết với chủ sở hữu lớp
    name TEXT NOT NULL,                          -- Ví dụ: Toán 9 Cơ Bản
    short_name TEXT NOT NULL,                    -- Ví dụ: T9CB (Hiển thị trên ô lịch)
    rate_per_session NUMERIC NOT NULL,           -- Giá tiền/thù lao cho 1 buổi dạy
    type VARCHAR(20) NOT NULL CHECK (type IN ('FIXED', 'EXTRA')), -- Phân loại lớp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. BẢNG LỊCH CỐ ĐỊNH LẶP LẠI (Class Schedules)
-- ============================================================================
CREATE TABLE public.class_schedules (
    id SERIAL PRIMARY KEY,
    class_id INT REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0: CN, 1: T2, ..., 6: T7
    start_time TIME NOT NULL,                    -- Giờ bắt đầu (Ví dụ: "18:00:00")
    end_time TIME NOT NULL,                      -- Giờ kết thúc (Ví dụ: "20:00:00")
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE, -- Ngày lịch này bắt đầu có hiệu lực
    valid_to DATE NULL,                          -- Ngày lịch này hết hiệu lực (NULL = vô thời hạn)
    CONSTRAINT check_time_order CHECK (start_time < end_time)
);

-- ============================================================================
-- 4. BẢNG NHẬT KÝ DẠY THỰC TẾ (Teaching Logs)
-- ============================================================================
CREATE TABLE public.teaching_logs (
    id SERIAL PRIMARY KEY,
    class_id INT REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,                            -- Ngày diễn ra buổi học thực tế
    status VARCHAR(20) NOT NULL CHECK (status IN ('ATTENDED', 'OFF', 'EXTRA')), 
    start_time TIME NULL,                          -- Chỉ bắt buộc điền khi status = 'EXTRA'
    end_time TIME NULL,                            -- Chỉ bắt buộc điền khi status = 'EXTRA'
    note TEXT,                                     -- Ghi chú
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. BẢNG GHI NHẬT KÝ HOẠT ĐỘNG (Admin Audit Logs)
-- ============================================================================
CREATE TABLE public.admin_audit_logs (
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

-- ============================================================================
-- TẠO CÁC CHỈ MỤC (Indexes) ĐỂ TỐI ƯU TỐC ĐỘ TRUY VẤN
-- ============================================================================
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_classes_user ON public.classes(user_id);
CREATE INDEX idx_schedules_class ON public.class_schedules(class_id);
CREATE INDEX idx_logs_class_date ON public.teaching_logs(class_id, date);
CREATE INDEX idx_audit_logs_target_user ON public.admin_audit_logs(target_user_id);
CREATE INDEX idx_audit_logs_admin ON public.admin_audit_logs(admin_id);

-- ============================================================================
-- THIẾT LẬP BẢO MẬT HÀNG (Row Level Security - RLS) CHO TẤT CẢ CÁC BẢNG
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teaching_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Chính sách bảo mật cho bảng public.users (Profiles)
-- ----------------------------------------------------------------------------
CREATE POLICY "Allow insert for registration" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admin can read all profiles" ON public.users FOR SELECT USING (auth.email() IN ('admin@speanut.com', '111111@speanut.com'));
CREATE POLICY "Admin can update any profile" ON public.users FOR UPDATE USING (auth.email() IN ('admin@speanut.com', '111111@speanut.com')) WITH CHECK (auth.email() IN ('admin@speanut.com', '111111@speanut.com'));

-- ----------------------------------------------------------------------------
-- Chính sách bảo mật cho bảng public.classes (Lớp học)
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can read own classes" ON public.classes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own classes" ON public.classes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own classes" ON public.classes FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own classes" ON public.classes FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Admin can read all classes" ON public.classes FOR SELECT USING (auth.email() IN ('admin@speanut.com', '111111@speanut.com'));

-- ----------------------------------------------------------------------------
-- Chính sách bảo mật cho bảng public.class_schedules (Lịch cố định)
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can read own class schedules" ON public.class_schedules
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.classes WHERE classes.id = class_schedules.class_id AND classes.user_id = auth.uid()));

CREATE POLICY "Users can insert own class schedules" ON public.class_schedules
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.classes WHERE classes.id = class_schedules.class_id AND classes.user_id = auth.uid()));

CREATE POLICY "Users can update own class schedules" ON public.class_schedules
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.classes WHERE classes.id = class_schedules.class_id AND classes.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.classes WHERE classes.id = class_schedules.class_id AND classes.user_id = auth.uid()));

CREATE POLICY "Users can delete own class schedules" ON public.class_schedules
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.classes WHERE classes.id = class_schedules.class_id AND classes.user_id = auth.uid()));

CREATE POLICY "Admin can read all class schedules" ON public.class_schedules
  FOR SELECT USING (auth.email() IN ('admin@speanut.com', '111111@speanut.com'));

-- ----------------------------------------------------------------------------
-- Chính sách bảo mật cho bảng public.teaching_logs (Nhật ký dạy thực tế)
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can read own teaching logs" ON public.teaching_logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.classes WHERE classes.id = teaching_logs.class_id AND classes.user_id = auth.uid()));

CREATE POLICY "Users can insert own teaching logs" ON public.teaching_logs
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.classes WHERE classes.id = teaching_logs.class_id AND classes.user_id = auth.uid()));

CREATE POLICY "Users can update own teaching logs" ON public.teaching_logs
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.classes WHERE classes.id = teaching_logs.class_id AND classes.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.classes WHERE classes.id = teaching_logs.class_id AND classes.user_id = auth.uid()));

CREATE POLICY "Users can delete own teaching logs" ON public.teaching_logs
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.classes WHERE classes.id = teaching_logs.class_id AND classes.user_id = auth.uid()));

CREATE POLICY "Admin can read all teaching logs" ON public.teaching_logs
  FOR SELECT USING (auth.email() IN ('admin@speanut.com', '111111@speanut.com'));

-- ----------------------------------------------------------------------------
-- Chính sách bảo mật cho bảng public.admin_audit_logs (Nhật ký hoạt động Admin)
-- ----------------------------------------------------------------------------
CREATE POLICY "Admin can read audit logs" ON public.admin_audit_logs
  FOR SELECT USING (auth.email() IN ('admin@speanut.com', '111111@speanut.com'));

CREATE POLICY "Users can read own audit logs" ON public.admin_audit_logs
  FOR SELECT USING (target_user_id = auth.uid());

CREATE POLICY "Users can insert own audit logs" ON public.admin_audit_logs
  FOR INSERT WITH CHECK (admin_id = auth.uid());

-- ============================================================================
-- TẠO TRIGGER TỰ ĐỘNG GHI NHẬT KÝ KHI ADMIN SỬA THƯỞNG/THÊM (extra_incomes)
-- ============================================================================
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Gắn trigger vào bảng users
CREATE TRIGGER trigger_log_admin_extra_incomes_changes
  AFTER UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION log_admin_extra_incomes_changes();

-- ============================================================================
-- TẠO TRIGGER TỰ ĐỘNG GHI NHẬT KÝ THÊM/XÓA LỚP HỌC (CREATE_CLASS / DELETE_CLASS)
-- ============================================================================
CREATE OR REPLACE FUNCTION log_classes_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_email VARCHAR(255);
BEGIN
  IF (TG_OP = 'INSERT') THEN
    SELECT email INTO v_email FROM public.users WHERE id = NEW.user_id;
    INSERT INTO public.admin_audit_logs (
      admin_id, admin_email, action, target_user_id, target_user_email, new_value
    ) VALUES (
      COALESCE(auth.uid(), NEW.user_id),
      COALESCE(auth.email(), 'system@speanut.com'),
      'CREATE_CLASS',
      NEW.user_id,
      COALESCE(v_email, 'unknown@speanut.com'),
      jsonb_build_object('class_id', NEW.id, 'name', NEW.name, 'short_name', NEW.short_name, 'rate_per_session', NEW.rate_per_session)
    );
  ELSIF (TG_OP = 'DELETE') THEN
    SELECT email INTO v_email FROM public.users WHERE id = OLD.user_id;
    INSERT INTO public.admin_audit_logs (
      admin_id, admin_email, action, target_user_id, target_user_email, old_value
    ) VALUES (
      COALESCE(auth.uid(), OLD.user_id),
      COALESCE(auth.email(), 'system@speanut.com'),
      'DELETE_CLASS',
      OLD.user_id,
      COALESCE(v_email, 'unknown@speanut.com'),
      jsonb_build_object('class_id', OLD.id, 'name', OLD.name, 'short_name', OLD.short_name, 'rate_per_session', OLD.rate_per_session)
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_log_classes_changes
  AFTER INSERT OR DELETE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION log_classes_changes();

-- ============================================================================
-- TẠO TRIGGER TỰ ĐỘNG GHI NHẬT KÝ ĐĂNG KÝ/XÓA GIA SƯ (REGISTER_TEACHER / DELETE_TEACHER)
-- ============================================================================
CREATE OR REPLACE FUNCTION log_users_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.admin_audit_logs (
      admin_id, admin_email, action, target_user_id, target_user_email, new_value
    ) VALUES (
      COALESCE(auth.uid(), NEW.id),
      COALESCE(auth.email(), NEW.email),
      'REGISTER_TEACHER',
      NEW.id,
      NEW.email,
      jsonb_build_object('full_name', NEW.full_name)
    );
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public.admin_audit_logs (
      admin_id, admin_email, action, target_user_id, target_user_email, old_value
    ) VALUES (
      COALESCE(auth.uid(), OLD.id),
      COALESCE(auth.email(), OLD.email),
      'DELETE_TEACHER',
      OLD.id,
      OLD.email,
      jsonb_build_object('full_name', OLD.full_name)
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_log_users_changes
  AFTER INSERT OR DELETE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION log_users_changes();

-- ============================================================================
-- TRIGGER TỰ ĐỘNG TẠO PROFILE KHI NGƯỜI DÙNG MỚI ĐĂNG KÝ
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- TẠO RPC FUNCTION CHO ADMIN DASHBOARD (get_admin_dashboard_data)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_data()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Thực thi với đặc quyền cao để vượt qua RLS của bảng users
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Bảo mật: Chỉ cho phép tài khoản admin@speanut.com và 111111@speanut.com gọi hàm này
  IF auth.email() IN ('admin@speanut.com', '111111@speanut.com') THEN
    SELECT json_build_object(
      'users', (
        SELECT COALESCE(json_agg(u), '[]'::json) FROM (
          SELECT id, email, full_name, avatar, bank_brand, bank_number, bank_owner, bank_branch, qr_code, extra_incomes, cancelled_sessions
          FROM public.users
          ORDER BY email ASC
        ) u
      ),
      'classes', (
        SELECT COALESCE(json_agg(c), '[]'::json) FROM public.classes c
      ),
      'class_schedules', (
        SELECT COALESCE(json_agg(s), '[]'::json) FROM public.class_schedules s
      )
    ) INTO result;
    RETURN result;
  ELSE
    RAISE EXCEPTION 'Unauthorized: Ban khong co quyen truy cap du lieu admin!';
  END IF;
END;
$$;

-- ============================================================================
-- KHỞI TẠO TÀI KHOẢN GIÁO VIÊN MẪU & ADMIN
-- ============================================================================

-- Dọn dẹp triệt để các tài khoản cũ trong auth.users để đảm bảo khởi tạo đúng UUID mong muốn
DELETE FROM auth.users WHERE email IN ('lanhuong04011643@gmail.com', 'admin@speanut.com', '111111@speanut.com');

-- 1. Giáo Viên Mẫu: lanhuong04011643@gmail.com (Mật khẩu: 123456)
DO $$
DECLARE
  u_id UUID := 'b66ddf15-f7bb-4db1-a016-9bea0f6587a4';
  u_email TEXT := 'lanhuong04011643@gmail.com';
  u_password TEXT := '123456';
  u_hash TEXT;
BEGIN
  u_hash := crypt(u_password, gen_salt('bf', 10));
  
  DELETE FROM auth.users WHERE email = u_email AND email_confirmed_at IS NULL;
  
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = u_email) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      u_id, 'authenticated', 'authenticated',
      u_email, u_hash, now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Peanut"}',
      now(), now(), '', '', '', ''
    );
    
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      u_id, u_id,
      jsonb_build_object('sub', u_id::text, 'email', u_email, 'email_verified', true),
      'email', u_id::text, now(), now(), now()
    );
  END IF;
  
  UPDATE auth.users SET 
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    encrypted_password = u_hash
  WHERE email = u_email;
  
  INSERT INTO public.users (id, email, full_name)
  VALUES (u_id, u_email, 'Peanut')
  ON CONFLICT (id) DO NOTHING;
END $$;

-- 2. Admin 1: admin@speanut.com (Mật khẩu: 111111)
DO $$
DECLARE
  u_id UUID := 'a66ddf15-f7bb-4db1-a016-9bea0f6587a4';
  u_email TEXT := 'admin@speanut.com';
  u_password TEXT := '111111';
  u_hash TEXT;
BEGIN
  u_hash := crypt(u_password, gen_salt('bf', 10));
  
  DELETE FROM auth.users WHERE email = u_email AND email_confirmed_at IS NULL;
  
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = u_email) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      u_id, 'authenticated', 'authenticated',
      u_email, u_hash, now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Admin SPeanut"}',
      now(), now(), '', '', '', ''
    );
    
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      u_id, u_id,
      jsonb_build_object('sub', u_id::text, 'email', u_email, 'email_verified', true),
      'email', u_id::text, now(), now(), now()
    );
  END IF;
  
  UPDATE auth.users SET 
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    encrypted_password = u_hash
  WHERE email = u_email;
  
  INSERT INTO public.users (id, email, full_name)
  VALUES (u_id, u_email, 'Admin SPeanut')
  ON CONFLICT (id) DO NOTHING;
END $$;

-- 3. Admin 2: 111111@speanut.com (Mật khẩu: 111111)
DO $$
DECLARE
  u_id UUID := '11111111-1111-1111-1111-111111111111';
  u_email TEXT := '111111@speanut.com';
  u_password TEXT := '111111';
  u_hash TEXT;
BEGIN
  u_hash := crypt(u_password, gen_salt('bf', 10));
  
  DELETE FROM auth.users WHERE email = u_email AND email_confirmed_at IS NULL;
  
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = u_email) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      u_id, 'authenticated', 'authenticated',
      u_email, u_hash, now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Admin SPeanut 2"}',
      now(), now(), '', '', '', ''
    );
    
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      u_id, u_id,
      jsonb_build_object('sub', u_id::text, 'email', u_email, 'email_verified', true),
      'email', u_id::text, now(), now(), now()
    );
  END IF;
  
  UPDATE auth.users SET 
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    encrypted_password = u_hash
  WHERE email = u_email;
  
  INSERT INTO public.users (id, email, full_name)
  VALUES (u_id, u_email, 'Admin SPeanut 2')
  ON CONFLICT (id) DO NOTHING;
END $$;

-- ============================================================================
-- DỮ LIỆU LỚP HỌC VÀ LỊCH TRÌNH MẪU (Mock Data)
-- ============================================================================
INSERT INTO public.classes (id, user_id, name, short_name, rate_per_session, type, created_at) 
VALUES  
(2, 'b66ddf15-f7bb-4db1-a016-9bea0f6587a4', 'Toán 10 nâng cao', 'T10NC', 180000, 'FIXED', '2026-05-26 15:13:13.943902+00'), 
(3, 'b66ddf15-f7bb-4db1-a016-9bea0f6587a4', 'Toán 9 cơ bản 1', 'T9CB1', 180000, 'FIXED', '2026-05-26 15:18:04.079323+00'), 
(4, 'b66ddf15-f7bb-4db1-a016-9bea0f6587a4', 'Toán 9 cơ bản 2', 'T9CB2', 180000, 'FIXED', '2026-05-26 15:19:41.46276+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.class_schedules (class_id, day_of_week, start_time, end_time) 
VALUES  
(2, 1, '19:30:00', '21:15:00'),
(2, 3, '19:30:00', '21:15:00'),
(3, 1, '17:30:00', '19:30:00'),
(3, 3, '17:30:00', '19:30:00'),
(4, 2, '17:30:00', '19:30:00'),
(4, 5, '17:30:00', '19:30:00')
ON CONFLICT (class_id, day_of_week, start_time, end_time) DO NOTHING;

-- ĐỒNG BỘ BỘ ĐẾM TỰ TĂNG CHO ID CỦA BẢNG CLASSES
SELECT setval(pg_get_serial_sequence('public.classes', 'id'), COALESCE(MAX(id), 1)) FROM public.classes;

-- LÀM MỚI SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
