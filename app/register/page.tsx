'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from '../styles/Register.module.css';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlError = params.get('error');
      if (urlError) {
        setError(urlError === 'Google auth failed' ? 'Đăng ký Google thất bại hoặc bị hủy.' : urlError);
      }
    }
  }, []);

  const handleToggleTheme = (mode: 'light' | 'dark') => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleGoogleRegister = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Lỗi đăng ký bằng Google.');
      setLoading(false);
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

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: fullName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Đăng ký tài khoản không thành công.');
      }

      if (data.autoLogin) {
        // Đăng ký + đăng nhập thành công → vào trang chủ luôn
        setSuccess('Đăng ký thành công! Đang chuyển hướng...');
        setTimeout(() => {
          window.location.href = '/';
        }, 800);
      } else if (data.requireConfirm) {
        // Vẫn cần xác thực email
        setFullName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setSuccess('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản rồi đăng nhập.');
      } else {
        setSuccess(data.message || 'Đăng ký thành công!');
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authCard}>

      {/* Thanh gạt dark/light */}
      <div className={styles.switchContainer}>
        <div className={styles.slider} />
        <button type="button" className={styles.switchBtn} onClick={() => handleToggleTheme('light')}>☀️</button>
        <button type="button" className={styles.switchBtn} onClick={() => handleToggleTheme('dark')}>🌙</button>
      </div>

      <p className={styles.authTitle}>Đăng ký</p>

      <form onSubmit={handleSubmit}>

        <div className={styles.fieldPanel}>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Họ và tên"
            className={styles.fieldInput}
          />
        </div>

        <div className={styles.fieldPanel}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className={styles.fieldInput}
          />
        </div>

        <div className={styles.fieldPanel}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mật khẩu (tối thiểu 6 ký tự)"
            className={styles.fieldInput}
          />
        </div>

        <div className={styles.fieldPanel}>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Xác nhận mật khẩu"
            className={styles.fieldInput}
          />
        </div>

        {error && <div className={styles.feedbackError}>{error}</div>}
        {success && <div className={styles.feedbackSuccess}>{success}</div>}

        <div className={styles.actionGroup}>
          <button type="submit" disabled={loading} className={styles.buttonRegister}>
            {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </button>

          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>Hoặc</span>
            <span className={styles.dividerLine} />
          </div>

          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={loading}
            className={styles.buttonGoogle}
          >
            <svg className={styles.googleIcon} viewBox="0 0 24 24" width="20" height="20">
              <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.67 14.94 1 12 1 7.35 1 3.4 3.65 1.45 7.5l3.8 2.95C6.15 7.42 8.87 5.04 12 5.04z" />
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.47-1.11 2.72-2.36 3.56l3.66 2.84c2.14-1.97 3.73-4.87 3.73-8.55z" />
              <path fill="#FBBC05" d="M5.25 14.5c-.24-.72-.38-1.5-.38-2.3s.14-1.58.38-2.3L1.45 7.5C.52 9.35 0 11.4 0 13.6c0 2.2.52 4.25 1.45 6.1l3.8-2.95-.08-.25z" />
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.67-2.3 1.07-4.3 1.07-3.13 0-5.85-2.38-6.75-5.41L1.45 16.5C3.4 20.35 7.35 23 12 23z" />
            </svg>
            Đăng ký bằng Google
          </button>

          <Link href="/login" className={styles.buttonLink}>
            Đã có tài khoản? Đăng nhập ngay
          </Link>
        </div>
      </form>
    </div>
  );
}