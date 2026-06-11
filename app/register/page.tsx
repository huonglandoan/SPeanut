'use client';

import Link from 'next/link';
import { useState } from 'react';
import styles from '../styles/Register.module.css';

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

          <Link href="/login" className={styles.buttonLink}>
            Đã có tài khoản? Đăng nhập ngay
          </Link>
        </div>
      </form>
    </div>
  );
}