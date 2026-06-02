// services/auth.ts

interface LoginParams {
  email: string;
  password: string;    
}

/**
 * 1. Xử lý gửi yêu cầu đăng nhập lên API Route Server
 */
export async function LoginWithAPI({ email, password }: LoginParams) {
  console.log('[Service] Đang gửi yêu cầu đăng nhập lên API cho:', email);
  
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Đăng nhập không thành công.');
  }

  // Trả về dữ liệu (chứa thông tin user) để Frontend xử lý nếu cần
  return data;
}

interface RegisterParam {
  email: string;
  password: string;
  fullName: string;
}

/**
 * 2. Xử lý gửi yêu cầu đăng ký lên API Route Server
 */
export async function RegisterWithAPI({ email, password, fullName }: RegisterParam) {
  console.log('[Service] Đang gửi yêu cầu đăng ký tài khoản lên API cho:', email);
  
  const response = await fetch('/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // Gửi đúng trường 'name' theo yêu cầu payload của api/register/route.ts
    body: JSON.stringify({ email, password, name: fullName }), 
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Đăng ký tài khoản không thành công.');
  }

  return data;
}