'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import styles from '../styles/Login.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<'user' | 'admin' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlError = params.get('error');
      if (urlError) {
        setError(urlError === 'Google auth failed' ? 'Đăng nhập Google thất bại hoặc bị hủy.' : urlError);
      }
    }
  }, []);

  const handleToggleTheme = (mode: 'light' | 'dark') => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleQuickDemo = async (role: 'user' | 'admin') => {
    setError(null);
    setSuccess(null);
    setDemoLoading(role);
    setLoading(true);

    try {
      const demoEmail = role === 'admin' ? 'admin' : 'demo';
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể khởi tạo phiên demo.');
      }

      setSuccess(`Đang chuyển hướng sang giao diện ${role === 'admin' ? 'Quản Trị Viên' : 'Trợ Giảng'}...`);
      setTimeout(() => {
        window.location.href = data.redirectUrl || (role === 'admin' ? '/admin' : '/');
      }, 400);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi kích hoạt chế độ demo.');
      setDemoLoading(null);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'https://www.googleapis.com/auth/calendar.events email profile',
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Lỗi đăng nhập bằng Google.');
      setLoading(false);
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

      // Gọi API server-side để set cookie đúng cách
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Đăng nhập không thành công.');
      }

      setSuccess('Đăng nhập thành công!');

      // Chuyển hướng theo role trả về từ server
      setTimeout(() => {
        window.location.href = data.redirectUrl || '/';
      }, 300);
    } catch (err: any) {
      // Dịch lỗi tiếng Anh sang tiếng Việt
      let msg = err.message;
      if (msg.includes('Invalid login credentials')) msg = 'Email hoặc mật khẩu không đúng.';
      else if (msg.includes('Email not confirmed')) msg = 'Email chưa được xác thực. Vui lòng kiểm tra hộp thư.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className={styles.authCard}>
      {/* Thẻ H1 chuẩn SEO cho Google xếp hạng từ khóa SPeanut */}
      <h1 className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: 0 }}>
        SPeanut - Hệ Thống Quản Lý Lương & Lịch Làm Trợ Giảng
      </h1>

      {/* 1. Thanh gạt viên thuốc trượt mượt mà đồng bộ với trang Login */}
      <div className={styles.switchContainer}>
        <div className={styles.slider} />
        <button type="button" className={styles.switchBtn} onClick={() => handleToggleTheme('light')}>☀️</button>
        <button type="button" className={styles.switchBtn} onClick={() => handleToggleTheme('dark')}>🌙</button>
      </div>

      {/* 2. Tiêu đề Đăng nhập */}
      <p className={styles.authTitle}>Đăng nhập</p>

      {/* 3. Dùng thử nhanh */}
      <div className={styles.demoSection}>
        <div className={styles.demoLabel}>Dùng thử nhanh:</div>
        <div className={styles.demoGrid}>
          <button
            type="button"
            className={styles.demoBtn}
            onClick={() => handleQuickDemo('user')}
            disabled={loading}
          >
            {demoLoading === 'user' ? 'Đang vào...' : 'Trợ Giảng'}
          </button>

          <button
            type="button"
            className={styles.demoBtn}
            onClick={() => handleQuickDemo('admin')}
            disabled={loading}
          >
            {demoLoading === 'admin' ? 'Đang vào...' : 'Quản Trị Viên'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Email hoặc Tên đăng nhập */}
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
          {loading && !demoLoading ? 'Đang tải...' : 'Đăng nhập'}
        </button>

        <div className={styles.divider}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerText}>Hoặc</span>
          <span className={styles.dividerLine} />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className={styles.buttonGoogle}
        >
          <svg className={styles.googleIcon} viewBox="0 0 24 24" width="20" height="20">
            <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.67 14.94 1 12 1 7.35 1 3.4 3.65 1.45 7.5l3.8 2.95C6.15 7.42 8.87 5.04 12 5.04z" />
            <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.47-1.11 2.72-2.36 3.56l3.66 2.84c2.14-1.97 3.73-4.87 3.73-8.55z" />
            <path fill="#FBBC05" d="M5.25 14.5c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3L1.45 7.5C.52 9.35 0 11.4 0 13.6c0 2.2.52 4.25 1.45 6.1l3.8-2.95-.08-.25z" />
            <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.67-2.3 1.07-4.3 1.07-3.13 0-5.85-2.38-6.75-5.41L1.45 16.5C3.4 20.35 7.35 23 12 23z" />
          </svg>
          Tiếp tục với Google
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