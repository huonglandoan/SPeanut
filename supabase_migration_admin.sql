-- ============================================================
-- SPeanut: Migration thêm chức năng Admin Dashboard & Tạo tài khoản Admin
-- Chạy script này trên Supabase Dashboard → SQL Editor để kích hoạt.
-- ============================================================

-- 1. Xóa tài khoản admin cũ nếu chưa xác minh bị kẹt
DELETE FROM auth.users WHERE email = 'admin@speanut.com' AND email_confirmed_at IS NULL;

-- 2. Kích hoạt pgcrypto nếu chưa có
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 3. Khởi tạo tài khoản admin admin@speanut.com với mật khẩu 111111 (được xác minh sẵn)
DO $$
DECLARE
  admin_id UUID := gen_random_uuid();
  admin_email TEXT := 'admin@speanut.com';
  admin_password TEXT := '111111'; -- mật khẩu là 111111
  hashed_password TEXT;
BEGIN
  -- Mã hóa mật khẩu theo chuẩn bcrypt
  hashed_password := crypt(admin_password, gen_salt('bf', 10));

  -- Kiểm tra xem admin đã tồn tại trong auth.users chưa
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
    -- Chèn tài khoản vào bảng auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
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
      now(), -- Xác minh email ngay lập tức để bỏ qua xác thực email
      null,
      null,
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Admin SPeanut"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    -- Chèn profile vào bảng public.users
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = admin_id) THEN
      INSERT INTO public.users (id, email, full_name)
      VALUES (admin_id, admin_email, 'Admin SPeanut');
    END IF;

    -- Chèn vào bảng auth.identities để đồng bộ đăng nhập
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
    
    RAISE NOTICE 'Da tao thanh cong tai khoan Admin admin@speanut.com!';
  ELSE
    RAISE NOTICE 'Tai khoan Admin admin@speanut.com da ton tai!';
  END IF;
END $$;

-- 4. Tạo hàm RPC truy vấn dữ liệu Admin Dashboard
CREATE OR REPLACE FUNCTION get_admin_dashboard_data()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Cho phép bỏ qua RLS để truy vấn thông tin toàn bộ người dùng
AS $$
DECLARE
  result JSON;
BEGIN
  -- Chỉ cho phép tài khoản admin (admin@speanut.com) truy cập dữ liệu tổng hợp này
  IF auth.email() = 'admin@speanut.com' THEN
    SELECT json_build_object(
      'users', (
        SELECT COALESCE(json_agg(u), '[]'::json) FROM (
          SELECT id, email, full_name, avatar, bank_brand, bank_number, bank_owner, qr_code, extra_incomes
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

