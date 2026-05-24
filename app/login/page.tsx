'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LoginWithAPI } from '../services/auth'
import styles from '../styles/Login.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // Đã sửa chính tả setLoanding -> setLoading
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter(); // Đã thêm dấu () để kích hoạt router chuẩn ts(2339)

  const handleToggleTheme = (mode: 'light' | 'dark') => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError('Vui lòng nhập email và mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      // Gọi services
      const data = await LoginWithAPI({ email, password });
      
      // Nhận kết quả
      const { session } = data;
      const { error: setSessionError } = await supabase.auth.setSession(session);
      
      if (setSessionError) {
        setError(setSessionError.message);
        return;
      }

      setSuccess('Đăng nhập thành công!');

      // Chuyển user đến trang chính
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }; // <--- Đóng ngoặc hàm handleSubmit ở đây (Chuẩn)

return (
  <div className={styles.authCard}>
    
  
        {/* 1. Thanh gạt viên thuốc trượt mượt mà đồng bộ với trang Login */}
  <div className={styles.switchContainer}>
    <div className={styles.slider} />
    <button type="button" className={styles.switchBtn} onClick={() => handleToggleTheme('light')}>☀️</button>
    <button type="button" className={styles.switchBtn} onClick={() => handleToggleTheme('dark')}>🌙</button>
  </div>

  {/* 2. Tiêu đề Register */}

    <p className={styles.authTitle}>Login</p>

    <form onSubmit={handleSubmit}>
      
      {/*Email*/}
      <div className={styles.fieldPanel}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email" 
          className={styles.fieldInput}
        />
      </div>

      {/* Ô nhập Password: ĐÃ XÓA CHỮ PASSWORD Ở TRÊN, thay bằng placeholder="Password" */}
      <div className={styles.fieldPanel}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className={styles.fieldInput}
        />
      </div>

      {error && <div className={styles.feedbackError}>{error}</div>}
      {success && <div className={styles.feedbackSuccess}>{success}</div>}
      
      <div className={styles.actionGroup}></div>
      
      <button type="submit" disabled={loading} className={styles.buttonPrimary}>
        {loading ? 'LOADING...' : 'LOGIN'}
      </button>

      <p className={styles.textMuted}>
        Chưa có tài khoản?{' '}
        <Link href="/register" className={styles.linkInline}>
          Đăng ký ngay
        </Link>
      </p>
    </form>
  </div>
);
} 