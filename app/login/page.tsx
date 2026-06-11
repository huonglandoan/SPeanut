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
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
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
      let targetEmail = email.trim();
      if (targetEmail === 'admin') {
        targetEmail = 'admin@speanut.com';
      } else if (targetEmail === 'user') {
        targetEmail = 'user@speanut.com';
      }

      // Đăng nhập trực tiếp bằng client-side supabase instance
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }
      
      setSuccess('Đăng nhập thành công!');

      // Chuyển hướng
      const target = (targetEmail === 'admin@speanut.com')
        ? '/admin'
        : '/';
      window.location.href = target;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

return (
  <div className={styles.authCard}>
    
  
        {/* 1. Thanh gạt viên thuốc trượt mượt mà đồng bộ với trang Login */}
  <div className={styles.switchContainer}>
    <div className={styles.slider} />
    <button type="button" className={styles.switchBtn} onClick={() => handleToggleTheme('light')}>☀️</button>
    <button type="button" className={styles.switchBtn} onClick={() => handleToggleTheme('dark')}>🌙</button>
  </div>

  {/* 2. Tiêu đề Đăng nhập */}

    <p className={styles.authTitle}>Đăng nhập</p>

    <form onSubmit={handleSubmit}>
      
      {/*Email hoặc Tên đăng nhập*/}
      <div className={styles.fieldPanel}>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email hoặc Tên đăng nhập" 
          className={styles.fieldInput}
        />
      </div>

      {/* Ô nhập Mật khẩu */}
      <div className={styles.fieldPanel}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mật khẩu"
          className={styles.fieldInput}
        />
      </div>

      {error && <div className={styles.feedbackError}>{error}</div>}
      {success && <div className={styles.feedbackSuccess}>{success}</div>}
      
      <div className={styles.actionGroup}></div>
      
      <button type="submit" disabled={loading} className={styles.buttonPrimary}>
        {loading ? 'Đang tải...' : 'Đăng nhập'}
      </button>

      <p className={styles.textMuted}>
        Chưa có tài khoản?{' '}
        <Link href="/register" className={styles.linkInline}>
          Đăng ký ngay
        </Link>
      </p>

      <p className={styles.textMuted} style={{ marginTop: '12px', fontSize: '12px' }}>
        Thiết lập hệ thống?{' '}
        <Link href="/deploy" style={{ color: 'var(--primary, #735bf2)', fontWeight: 600, textDecoration: 'none' }}>
          Cấu hình & Deploy
        </Link>
      </p>
    </form>
  </div>
);
} 