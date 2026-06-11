-- ============================================================================
-- SPeanut: Unified Database Setup Script (Bảng biểu, RLS, & Tài khoản mặc định)
-- Chạy toàn bộ file này một lần duy nhất trong Supabase SQL Editor
-- ============================================================================

-- 1. Kích hoạt pgcrypto để dùng hàm mã hóa mật khẩu (phải chạy đầu tiên)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- XOÁ CÁC BẢNG CŨ (NẾU CÓ) ĐỂ TRÁNH LỖI TRÙNG LẶP
-- ============================================================================
DROP TABLE IF EXISTS teaching_logs CASCADE;
DROP TABLE IF EXISTS class_schedules CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- 1. BẢNG NGƯỜI DÙNG (Users) - Bao gồm các trường Profile & Thưởng
-- ============================================================================
CREATE TABLE users (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email varchar(255) UNIQUE NOT NULL,
    full_name varchar(108) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    last_active_at timestamp with time zone DEFAULT now(),
    avatar TEXT,
    bank_brand VARCHAR DEFAULT '',
    bank_number VARCHAR DEFAULT '',
    bank_owner VARCHAR DEFAULT '',
    bank_branch VARCHAR DEFAULT '',
    qr_code TEXT,
    extra_incomes JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- 2. BẢNG LỚP HỌC (Classes)
-- ============================================================================
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL, -- Liên kết với chủ sở hữu lớp
    name TEXT NOT NULL,                          -- Ví dụ: Toán 9 Cơ Bản
    short_name TEXT NOT NULL,                    -- Ví dụ: T9CB (Hiển thị trên ô lịch)
    rate_per_session NUMERIC NOT NULL,           -- Giá tiền/thù lao cho 1 buổi dạy
    type VARCHAR(20) NOT NULL CHECK (type IN ('FIXED', 'EXTRA')), -- Phân loại lớp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. BẢNG LỊCH CỐ ĐỊNH LẶP LẠI (Class Schedules)
-- ============================================================================
CREATE TABLE class_schedules (
    id SERIAL PRIMARY KEY,
    class_id INT REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
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
CREATE TABLE teaching_logs (
    id SERIAL PRIMARY KEY,
    class_id INT REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,                            -- Ngày diễn ra buổi học thực tế
    status VARCHAR(20) NOT NULL CHECK (status IN ('ATTENDED', 'OFF', 'EXTRA')), 
    start_time TIME NULL,                          -- Chỉ bắt buộc điền khi status = 'EXTRA'
    end_time TIME NULL,                            -- Chỉ bắt buộc điền khi status = 'EXTRA'
    note TEXT,                                     -- Ghi chú
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TẠO CÁC CHỈ MỤC (Indexes) ĐỂ TỐI ƯU TỐC ĐỘ
-- ============================================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_schedules_class ON class_schedules(class_id);
CREATE INDEX idx_logs_class_date ON teaching_logs(class_id, date);

-- ============================================================================
-- THIẾT LẬP BẢO MẬT HÀNG (Row Level Security - RLS)
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy cho phép user đọc profile của chính mình
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can read own profile'
  ) THEN
    CREATE POLICY "Users can read own profile"
      ON public.users
      FOR SELECT
      USING (auth.uid() = id);
  END IF;
END $$;

-- Policy cho phép user cập nhật profile của chính mình
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.users
      FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- ============================================================================
-- 1. KHỞI TẠO TÀI KHOẢN GIÁO VIÊN MẪU: user@speanut.com (Mật khẩu: 123456)
-- ============================================================================
DELETE FROM auth.users WHERE email = 'user@speanut.com';

DO $$
DECLARE
  user_uuid UUID := 'c66ddf15-f7bb-4db1-a016-9bea0f6587a4';
  user_email TEXT := 'user@speanut.com';
  user_password TEXT := '123456'; -- Mật khẩu mặc định của giáo viên mẫu
  hashed_password TEXT;
BEGIN
  hashed_password := crypt(user_password, gen_salt('bf', 10));

  -- Tạo tài khoản mẫu trong auth.users nếu chưa tồn tại
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      user_uuid,
      'authenticated',
      'authenticated',
      user_email,
      hashed_password,
      now(), -- Đã xác minh email
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Giao Vien Mau"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    -- Tạo record tương ứng trong auth.identities
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      user_uuid,
      user_uuid,
      jsonb_build_object('sub', user_uuid::text, 'email', user_email, 'email_verified', true, 'phone_verified', false),
      'email',
      user_uuid::text,
      now(),
      now(),
      now()
    );
  END IF;

  -- KHÔNG ĐIỀU KIỆN: Đảm bảo mật khẩu của giáo viên mẫu luôn được đặt về đúng '123456'
  UPDATE auth.users 
  SET encrypted_password = crypt(user_password, gen_salt('bf', 10))
  WHERE email = user_email;

  -- KHÔNG ĐIỀU KIỆN: Đảm bảo tài khoản giáo viên mẫu luôn được xác nhận
  UPDATE auth.users 
  SET email_confirmed_at = now()
  WHERE email = user_email;

  -- KHÔNG ĐIỀU KIỆN: Đảm bảo record profile của giáo viên luôn có trong public.users
  INSERT INTO public.users (id, email, full_name)
  SELECT id, email, 'Giáo Viên Mẫu'
  FROM auth.users
  WHERE email = user_email
  ON CONFLICT (id) DO NOTHING;
END $$;

-- ============================================================================
-- 2. KHỞI TẠO TÀI KHOẢN ADMIN: admin@speanut.com (Mật khẩu: 111111)
-- ============================================================================
DELETE FROM auth.users WHERE email = 'admin@speanut.com';

DO $$
DECLARE
  admin_id UUID := 'a66ddf15-f7bb-4db1-a016-9bea0f6587a4';
  admin_email TEXT := 'admin@speanut.com';
  admin_password TEXT := '111111'; -- Mật khẩu mặc định của admin
  hashed_password TEXT;
BEGIN
  hashed_password := crypt(admin_password, gen_salt('bf', 10));

  -- Tạo nếu chưa tồn tại trong auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_id,
      'authenticated',
      'authenticated',
      admin_email,
      hashed_password,
      now(), -- Đã xác minh email
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Admin SPeanut"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    -- Đồng bộ đăng nhập qua bảng auth.identities
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      admin_id,
      admin_id,
      jsonb_build_object('sub', admin_id::text, 'email', admin_email, 'email_verified', true, 'phone_verified', false),
      'email',
      admin_id::text,
      now(),
      now(),
      now()
    );
  END IF;

  -- KHÔNG ĐIỀU KIỆN: Đảm bảo mật khẩu của admin luôn là '111111'
  UPDATE auth.users 
  SET encrypted_password = crypt(admin_password, gen_salt('bf', 10))
  WHERE email = admin_email;

  -- KHÔNG ĐIỀU KIỆN: Đảm bảo email của admin luôn được xác thực thành công
  UPDATE auth.users 
  SET email_confirmed_at = now()
  WHERE email = admin_email;

  -- KHÔNG ĐIỀU KIỆN: Đảm bảo record profile của admin luôn tồn tại trong public.users
  INSERT INTO public.users (id, email, full_name)
  SELECT id, email, 'Admin SPeanut'
  FROM auth.users
  WHERE email = admin_email
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Đồng bộ bộ đếm tự tăng cho cột ID bảng classes
SELECT setval(pg_get_serial_sequence('"public"."classes"', 'id'), COALESCE(MAX(id), 1)) FROM "public"."classes";

-- ============================================================================
-- TẠO RPC FUNCTION CHO ADMIN DASHBOARD (get_admin_dashboard_data)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_admin_dashboard_data()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Thực thi với đặc quyền admin để vượt qua RLS của bảng users
AS $$
DECLARE
  result JSON;
BEGIN
  -- Bảo mật: Chỉ cho phép tài khoản admin@speanut.com gọi hàm này
  IF auth.email() = 'admin@speanut.com' THEN
    SELECT json_build_object(
      'users', (
        SELECT COALESCE(json_agg(u), '[]'::json) FROM (
          SELECT id, email, full_name, avatar, bank_brand, bank_number, bank_owner, bank_branch, qr_code, extra_incomes
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

-- Đồng bộ cấu trúc Schema
NOTIFY pgrst, 'reload schema';
