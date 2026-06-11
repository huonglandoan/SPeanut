-- ============================================================
-- SPeanut: Migration thêm cột profile vào bảng users
-- Chạy script này trên Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar TEXT,
ADD COLUMN IF NOT EXISTS bank_brand VARCHAR DEFAULT '',
ADD COLUMN IF NOT EXISTS bank_number VARCHAR DEFAULT '',
ADD COLUMN IF NOT EXISTS bank_owner VARCHAR DEFAULT '',
ADD COLUMN IF NOT EXISTS bank_branch VARCHAR DEFAULT '',
ADD COLUMN IF NOT EXISTS qr_code TEXT,
ADD COLUMN IF NOT EXISTS extra_incomes JSONB DEFAULT '{}'::jsonb;

-- Đảm bảo RLS cho phép user chỉ đọc/ghi profile của chính mình
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
