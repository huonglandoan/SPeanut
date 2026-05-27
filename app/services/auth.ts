import { supabase } from '@/lib/supabase';
interface LoginParams{
    email: string,
    password: string,    
}

export async function LoginWithAPI({email, password}:LoginParams) {
    console.log('Calling API /api/auth/login', {email});

    const response = await fetch('api/auth/login',{
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    console.log('Login API respon', data);

    if(!response.ok || data.error){
        throw new Error(data.error || 'Đăng nhập thất bại');
    }
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
        name: fullName,
        role: 'user', 
      },
    ]);
    
    if (insertError) throw new Error(insertError.message);
  }

  return data;
}

