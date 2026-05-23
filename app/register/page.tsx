'use client';

import Link from 'next/link';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from '../styles/Register.module.css'; 
import { RegisterWithAPI } from '../services/auth';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Vui lòng điền tất cả các trường.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu và xác nhận mật khẩu phải giống nhau.');
      return;
    }

    setLoading(true);
    
    try {
      await RegisterWithAPI({ email, password, fullName });

  setFullName('');
  setEmail('');
  setPassword('');
  setConfirmPassword('');
  setSuccess('Đăng ký thành công! Vui lòng kiểm tra email để xác thực.');
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

      {/* 2. Tiêu đề Register */}
      <p className={styles.authTitle}>Register</p>

      <form onSubmit={handleSubmit}>
        
        {/* Ô nhập Full Name (Đã bỏ thẻ label, dùng placeholder chuẩn Figma) */}
        <div className={styles.fieldPanel}>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name"
            className={styles.fieldInput}
          />
        </div>

        {/* Ô nhập E-mail */}
        <div className={styles.fieldPanel}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            className={styles.fieldInput}
          />
        </div>

        {/* Ô nhập Password */}
        <div className={styles.fieldPanel}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className={styles.fieldInput}
          />
        </div>

        {/* Ô nhập Confirm Password */}
        <div className={styles.fieldPanel}>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            className={styles.fieldInput}
          />
        </div>

        {/* Hiển thị thông báo lỗi/thành công */}
        {error && <div className={styles.feedbackError}>{error}</div>}
        {success && <div className={styles.feedbackSuccess}>{success}</div>}

        {/* 3. Cụm nút bấm kéo dài 100% xếp chồng chuẩn chỉnh theo bản Dark/Light Register */}
        <div className={styles.actionGroup}>
          <button type="submit" disabled={loading} className={styles.buttonRegister}>
            {loading ? 'Đang tạo tài khoản...' : 'Register'}
          </button>
          
          <Link href="/login" className={styles.buttonLink}>
            Have account? Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}