-- ============================================================
-- SPeanut: Full DB Setup - Chạy 1 lần trong Supabase SQL Editor
-- ============================================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- XÓA BẢNG CŨ
-- ============================================================
DROP TABLE IF EXISTS teaching_logs CASCADE;
DROP TABLE IF EXISTS class_schedules CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- 1. BẢNG USERS (gộp tất cả cột luôn, không cần ALTER sau)
-- ============================================================
CREATE TABLE public.users (
    id            uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email         varchar(255) UNIQUE NOT NULL,
    full_name     varchar(108) NOT NULL,
    avatar        TEXT,
    bank_brand    VARCHAR DEFAULT '',
    bank_number   VARCHAR DEFAULT '',
    bank_owner    VARCHAR DEFAULT '',
    bank_branch   VARCHAR DEFAULT '',
    qr_code       TEXT,
    extra_incomes JSONB DEFAULT '{}'::jsonb,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. BẢNG CLASSES
-- ============================================================
CREATE TABLE public.classes (
    id               SERIAL PRIMARY KEY,
    user_id          uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name             TEXT NOT NULL,
    short_name       TEXT NOT NULL,
    rate_per_session NUMERIC NOT NULL,
    type             VARCHAR(20) NOT NULL CHECK (type IN ('FIXED', 'EXTRA')),
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 3. BẢNG CLASS_SCHEDULES
-- ============================================================
CREATE TABLE public.class_schedules (
    id           SERIAL PRIMARY KEY,
    class_id     INT REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    day_of_week  INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time   TIME NOT NULL,
    end_time     TIME NOT NULL,
    valid_from   DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_to     DATE NULL,
    CONSTRAINT check_time_order CHECK (start_time < end_time)
);

-- ============================================================
-- 4. BẢNG TEACHING_LOGS
-- ============================================================
CREATE TABLE public.teaching_logs (
    id         SERIAL PRIMARY KEY,
    class_id   INT REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    date       DATE NOT NULL,
    status     VARCHAR(20) NOT NULL CHECK (status IN ('ATTENDED', 'OFF', 'EXTRA')),
    start_time TIME NULL,
    end_time   TIME NULL,
    note       TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_users_email      ON public.users(email);
CREATE INDEX idx_schedules_class  ON public.class_schedules(class_id);
CREATE INDEX idx_logs_class_date  ON public.teaching_logs(class_id, date);

-- ============================================================
-- RLS + POLICIES
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- SELECT: chỉ đọc profile của chính mình
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- UPDATE: chỉ sửa profile của chính mình
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT: cho phép insert khi đăng ký (FK ràng buộc id→auth.users đảm bảo an toàn)
CREATE POLICY "Allow insert for registration"
  ON public.users FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- TÀI KHOẢN ADMIN (admin@speanut.com / 111111)
-- ============================================================
DO $$
DECLARE
  v_admin_id   UUID := 'a66ddf15-f7bb-4db1-a016-9bea0f6587a4';
  v_email      TEXT := 'admin@speanut.com';
  v_password   TEXT := '111111';
  v_hash       TEXT;
BEGIN
  v_hash := crypt(v_password, gen_salt('bf', 10));

  -- Xóa admin cũ chưa xác minh (nếu có)
  DELETE FROM auth.users WHERE email = v_email AND email_confirmed_at IS NULL;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_admin_id, 'authenticated', 'authenticated',
      v_email, v_hash, now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Admin SPeanut"}',
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_admin_id, v_admin_id,
      jsonb_build_object('sub', v_admin_id::text, 'email', v_email, 'email_verified', true),
      'email', v_admin_id::text, now(), now(), now()
    );
  END IF;

  -- Đảm bảo email admin luôn được xác minh và mật khẩu đúng
  UPDATE auth.users SET
    email_confirmed_at  = COALESCE(email_confirmed_at, now()),
    encrypted_password  = v_hash
  WHERE email = v_email;

  -- Đảm bảo profile admin tồn tại
  INSERT INTO public.users (id, email, full_name)
  SELECT id, email, 'Admin SPeanut' FROM auth.users WHERE email = v_email
  ON CONFLICT (id) DO NOTHING;
END $$;

-- ============================================================
-- TÀI KHOẢN USER MẪU (lanhuong04011643@gmail.com)
-- Chỉ insert profile nếu auth user đã tồn tại
-- ============================================================
INSERT INTO public.users (id, email, full_name)
VALUES ('b66ddf15-f7bb-4db1-a016-9bea0f6587a4', 'lanhuong04011643@gmail.com', 'Peanut')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DỮ LIỆU MẪU: Classes & Schedules
-- ============================================================
INSERT INTO public.classes (id, user_id, name, short_name, rate_per_session, type, created_at)
VALUES
  (2, 'b66ddf15-f7bb-4db1-a016-9bea0f6587a4', 'Toán 10 nâng cao',  'T10NC', 180000, 'FIXED', '2026-05-26 15:13:13+00'),
  (3, 'b66ddf15-f7bb-4db1-a016-9bea0f6587a4', 'Toán 9 cơ bản 1',   'T9CB1', 180000, 'FIXED', '2026-05-26 15:18:04+00'),
  (4, 'b66ddf15-f7bb-4db1-a016-9bea0f6587a4', 'Toán 9 cơ bản 2',   'T9CB2', 180000, 'FIXED', '2026-05-26 15:19:41+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.class_schedules (class_id, day_of_week, start_time, end_time)
VALUES
  (2, 1, '19:30:00', '21:15:00'),
  (2, 3, '19:30:00', '21:15:00'),
  (3, 1, '17:30:00', '19:30:00'),
  (3, 3, '17:30:00', '19:30:00'),
  (4, 2, '17:30:00', '19:30:00'),
  (4, 5, '17:30:00', '19:30:00');

-- Đồng bộ sequence
SELECT setval(pg_get_serial_sequence('public.classes', 'id'), COALESCE(MAX(id), 1)) FROM public.classes;

-- ============================================================
-- RPC FUNCTION: Admin Dashboard (định nghĩa 1 lần duy nhất)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_data()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE result JSON;
BEGIN
  IF auth.email() = 'admin@speanut.com' THEN
    SELECT json_build_object(
      'users', (
        SELECT COALESCE(json_agg(u), '[]'::json) FROM (
          SELECT id, email, full_name, avatar, bank_brand, bank_number,
                 bank_owner, bank_branch, qr_code, extra_incomes
          FROM public.users ORDER BY email ASC
        ) u
      ),
      'classes',        (SELECT COALESCE(json_agg(c), '[]'::json) FROM public.classes c),
      'class_schedules',(SELECT COALESCE(json_agg(s), '[]'::json) FROM public.class_schedules s)
    ) INTO result;
    RETURN result;
  ELSE
    RAISE EXCEPTION 'Unauthorized';
  END IF;
END;
$$;

-- ============================================================
-- RELOAD SCHEMA
-- ============================================================
NOTIFY pgrst, 'reload schema';
