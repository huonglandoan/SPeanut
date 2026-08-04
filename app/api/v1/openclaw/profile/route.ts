import { NextResponse } from 'next/server';
import { verifyOpenClawAuth, handleCorsOptions, corsHeaders } from '@/lib/openclaw-auth';

export async function OPTIONS() {
  return handleCorsOptions();
}

export async function GET(request: Request) {
  const auth = await verifyOpenClawAuth(request);
  if (!auth.authenticated || !auth.user || !auth.supabase) {
    return NextResponse.json({ error: auth.error }, { status: 401, headers: corsHeaders });
  }

  const { user } = auth;
  return NextResponse.json({
    status: 'success',
    profile: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      bank_brand: user.bank_brand || 'Chưa cập nhật',
      bank_number: user.bank_number || 'Chưa cập nhật',
      bank_owner: user.bank_owner || 'Chưa cập nhật',
    },
  }, { status: 200, headers: corsHeaders });
}

export async function PUT(request: Request) {
  const auth = await verifyOpenClawAuth(request);
  if (!auth.authenticated || !auth.user || !auth.supabase) {
    return NextResponse.json({ error: auth.error }, { status: 401, headers: corsHeaders });
  }

  try {
    const { user, supabase } = auth;
    const body = await request.json();
    const { full_name, bank_brand, bank_number, bank_owner } = body;

    const updates: any = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (bank_brand !== undefined) updates.bank_brand = bank_brand;
    if (bank_number !== undefined) updates.bank_number = bank_number;
    if (bank_owner !== undefined) updates.bank_owner = bank_owner;

    if (user.id && user.id !== 'user_openclaw_active' && user.id !== 'user_openclaw_default') {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      if (error) throw error;
    }

    return NextResponse.json({
      status: 'success',
      message: 'Đã cập nhật thông tin cá nhân và ngân hàng thành công.',
      updated_profile: { ...user, ...updates },
    }, { status: 200, headers: corsHeaders });

  } catch (err: any) {
    console.error('Error at PUT /api/v1/openclaw/profile:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500, headers: corsHeaders });
  }
}
