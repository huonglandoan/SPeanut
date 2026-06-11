-- ============================================================
-- SPeanut: Thêm cột profile còn thiếu vào bảng users
-- Script này KHÔNG xoá hay sửa bất cứ thứ gì đang có.
-- Chỉ ADD COLUMN IF NOT EXISTS → hoàn toàn an toàn để chạy lại nhiều lần.
-- ============================================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bank_brand VARCHAR DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bank_number VARCHAR DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bank_owner VARCHAR DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bank_branch VARCHAR DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS qr_code TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS extra_incomes JSONB;

-- Reload schema để PostgREST nhận biết cột mới
NOTIFY pgrst, 'reload schema';
