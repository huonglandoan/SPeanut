import { supabase } from '@/lib/supabase';
interface LoginParams{
    email: string,
    password: string,    
}

export async function LoginWithAPI({ email, password }: LoginParams) {
  console.log('[Service] Đang xử lý đăng nhập thẳng qua Supabase cho:', email);
  
  // Gọi trực tiếp Supabase từ Frontend Client
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  // Trả về data (đã bao gồm session và user mà Supabase tự động thiết lập)
  return data;
}

interface RegisterParam{
    email: string,
    password: string,
    fullName: string
}

export async function RegisterWithAPI({email, password, fullName} : RegisterParam){
    console.log('[Service] Đang xử lý đăng ký tài khoản cho:', email);
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) throw new Error(signUpError.message);

    if (data.user) {
    const { error: insertError } = await supabase.from('users').insert([
      {
        id: data.user.id,
        email,
        full_name: fullName,
      },
    ]);
    
    if (insertError) throw new Error(insertError.message);
  }

  return data;
}

