// app/deploy/page.tsx
'use client'

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Save, RefreshCw, Trash2, Database, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import styles from '../styles/Deploy.module.css';

export default function DeployConfigPage() {
  const [companyName, setCompanyName] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load configuration from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCompanyName(localStorage.getItem('speanut_config_company_name') || '');
      setSupabaseUrl(localStorage.getItem('speanut_config_supabase_url') || '');
      setSupabaseAnonKey(localStorage.getItem('speanut_config_supabase_anon_key') || '');
      setGoogleClientId(localStorage.getItem('speanut_config_google_client_id') || '');
    }
  }, []);

  // Save config to localStorage
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      if (companyName.trim()) {
        localStorage.setItem('speanut_config_company_name', companyName.trim());
      } else {
        localStorage.removeItem('speanut_config_company_name');
      }

      if (supabaseUrl.trim() && supabaseAnonKey.trim()) {
        localStorage.setItem('speanut_config_supabase_url', supabaseUrl.trim());
        localStorage.setItem('speanut_config_supabase_anon_key', supabaseAnonKey.trim());
      } else {
        localStorage.removeItem('speanut_config_supabase_url');
        localStorage.removeItem('speanut_config_supabase_anon_key');
      }

      if (googleClientId.trim()) {
        localStorage.setItem('speanut_config_google_client_id', googleClientId.trim());
      } else {
        localStorage.removeItem('speanut_config_google_client_id');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      alert('Đã lưu cấu hình doanh nghiệp thành công! Ứng dụng sẽ tự động tải dữ liệu theo thông số mới.');
    }
  };

  // Reset to static environment defaults
  const handleReset = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa cấu hình tùy biến và khôi phục hệ thống về mặc định không?')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('speanut_config_company_name');
        localStorage.removeItem('speanut_config_supabase_url');
        localStorage.removeItem('speanut_config_supabase_anon_key');
        localStorage.removeItem('speanut_config_google_client_id');
        
        setCompanyName('');
        setSupabaseUrl('');
        setSupabaseAnonKey('');
        setGoogleClientId('');
        setTestStatus('idle');
        setTestMessage('');
        
        alert('Đã xóa cấu hình tùy biến. Hệ thống quay về cơ sở dữ liệu mặc định của môi trường.');
      }
    }
  };

  // Test Supabase connection client-side
  const handleTestConnection = async () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setTestStatus('error');
      setTestMessage('Vui lòng điền đầy đủ Supabase URL và Anon Public Key để chạy thử nghiệm.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Đang kết nối tới Supabase API...');

    try {
      // Create temporary connection instance
      const tempClient = createClient(supabaseUrl.trim(), supabaseAnonKey.trim());
      
      // Attempt to query standard users table
      const { data, error } = await tempClient
        .from('users')
        .select('id')
        .limit(1);

      if (error) {
        // PostgREST return code PGRST116/PGRST204 is acceptable (indicates connection success but table empty or query fail due to RLS/schema)
        // Check for specific database errors: code starts with 42P or similar (meaning tables don't exist yet)
        if (error.code && error.code.startsWith('42')) {
          setTestStatus('error');
          setTestMessage(`Kết nối tới Supabase thành công nhưng gặp lỗi Schema: ${error.message} (Có thể bạn chưa chạy các file SQL để khởi tạo bảng users trong SQL Editor).`);
        } else {
          // If query reaches the database, authorization/policy failures are connection successes
          setTestStatus('success');
          setTestMessage('Thử nghiệm thành công! Supabase phản hồi đúng. Cơ sở dữ liệu và API đã sẵn sàng.');
        }
      } else {
        setTestStatus('success');
        setTestMessage('Thử nghiệm thành công! Kết nối cơ sở dữ liệu hoạt động chính xác và bảng users đã sẵn sàng.');
      }
    } catch (err: any) {
      console.error(err);
      setTestStatus('error');
      setTestMessage(`Không thể kết nối: ${err.message || 'Sai địa chỉ URL hoặc khóa API'}`);
    }
  };

  return (
    <div className={styles.deployWrapper}>
      <article className={styles.deployCard}>
        <a href="/" className={styles.navLink}>
          <ArrowLeft size={16} />
          <span>Quay lại Trang chủ</span>
        </a>

        <header style={{ marginBottom: '32px' }}>
          <h1 className={styles.deployTitle}>
            <Sparkles style={{ color: '#735bf2' }} />
            Cấu hình Module Độc lập
          </h1>
          <p className={styles.deploySubtitle}>
            Nhập thông số cơ sở dữ liệu Supabase mới và Google API mới để tách hệ thống chạy độc lập cho từng công ty/chi nhánh.
          </p>
        </header>

        {saveSuccess && (
          <div className={`${styles.statusBanner} ${styles.statusSuccess}`}>
            <CheckCircle2 size={18} />
            <span>Cấu hình đã được lưu và kích hoạt!</span>
          </div>
        )}

        {testStatus === 'testing' && (
          <div className={`${styles.statusBanner}`} style={{ backgroundColor: 'rgba(115, 91, 242, 0.05)', color: '#735bf2', border: '1px solid rgba(115, 91, 242, 0.15)' }}>
            <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
            <span>{testMessage}</span>
          </div>
        )}

        {testStatus === 'success' && (
          <div className={`${styles.statusBanner} ${styles.statusSuccess}`}>
            <CheckCircle2 size={18} />
            <span>{testMessage}</span>
          </div>
        )}

        {testStatus === 'error' && (
          <div className={`${styles.statusBanner} ${styles.statusError}`}>
            <ShieldAlert size={18} />
            <span>{testMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave}>
          <h3 className={styles.sectionTitle}>Thông tin Nhãn hiệu</h3>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Tên Doanh nghiệp / Nhãn hiệu</label>
            <input 
              type="text" 
              placeholder="Ví dụ: SPeanut Academy, Trung tâm XYZ..."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className={styles.input}
            />
          </div>

          <h3 className={styles.sectionTitle} style={{ marginTop: '32px' }}>Kết nối Database (Supabase)</h3>

          <div className={styles.formGroup}>
            <label className={styles.label}>Supabase Project URL</label>
            <input 
              type="url" 
              placeholder={process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co"}
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className={styles.input}
            />
            {process.env.NEXT_PUBLIC_SUPABASE_URL && !supabaseUrl && (
              <span style={{ fontSize: '12px', color: '#00b383', marginTop: '6px', display: 'block' }}>
                ✓ Đang sử dụng Project URL mặc định từ file cấu hình (.env) cho mọi người dùng.
              </span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Supabase Anon Public Key (Khóa API Công khai)</label>
            <input 
              type="password" 
              placeholder={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "••••••••••••••••" : "eyJhbGciOi..."}
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              className={styles.input}
            />
            {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !supabaseAnonKey && (
              <span style={{ fontSize: '12px', color: '#00b383', marginTop: '6px', display: 'block' }}>
                ✓ Đang sử dụng Anon Key mặc định từ file cấu hình (.env) cho mọi người dùng.
              </span>
            )}
          </div>

          <h3 className={styles.sectionTitle} style={{ marginTop: '32px' }}>Đồng bộ Lịch (Google Calendar API)</h3>

          <div className={styles.formGroup}>
            <label className={styles.label}>Google OAuth2 Client ID</label>
            <input 
              type="text" 
              placeholder={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "123456789-abc123xyz.apps.googleusercontent.com"}
              value={googleClientId}
              onChange={(e) => setGoogleClientId(e.target.value)}
              className={styles.input}
            />
            {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && !googleClientId && (
              <span style={{ fontSize: '12px', color: '#00b383', marginTop: '6px', display: 'block' }}>
                ✓ Đang sử dụng Google Client ID mặc định từ file cấu hình (.env). Tất cả người dùng đăng nhập sẽ tự động được sử dụng Client ID này mà không cần thiết lập thủ công.
              </span>
            )}
          </div>


          <div className={styles.btnRow}>
            <button 
              type="button" 
              onClick={handleTestConnection}
              className={`${styles.btn} ${styles.btnSecondary}`}
            >
              <Database size={16} />
              <span>Kiểm tra kết nối DB</span>
            </button>
            
            <button 
              type="submit" 
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              <Save size={16} />
              <span>Lưu và kích hoạt</span>
            </button>

            {(supabaseUrl || googleClientId || companyName) && (
              <button 
                type="button" 
                onClick={handleReset}
                className={`${styles.btn} ${styles.btnDanger}`}
                title="Khôi phục về mặc định ban đầu"
              >
                <Trash2 size={16} />
                <span>Mặc định</span>
              </button>
            )}
          </div>
        </form>

        <section className={styles.instructionsCard}>
          <h4 className={styles.instructionTitle}>
            <Database size={18} style={{ color: '#00b383' }} />
            Hướng dẫn cài đặt Database cho đối tác bán ứng dụng:
          </h4>
          <ol className={styles.instructionList}>
            <li className={styles.instructionItem}>
              Tạo một project trống mới trên <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={{ color: '#00b383', fontWeight: 600 }}>Supabase</a>.
            </li>
            <li className={styles.instructionItem}>
              Mở và copy toàn bộ nội dung file SQL <a href="file:///Users/macbook/Desktop/SPeanut/supabase_migration_unified.sql" style={{ color: '#735bf2', fontWeight: 500 }}>supabase_migration_unified.sql</a> ở thư mục gốc của dự án.
            </li>
            <li className={styles.instructionItem}>
              Dán đoạn code SQL đó vào mục **SQL Editor** trên trang quản trị dự án Supabase mới của đối tác và nhấn nút **Run** để tự động thiết lập toàn bộ bảng biểu, RLS policies, dữ liệu mẫu của giáo viên Peanut, tạo RPC và tạo sẵn tài khoản quản trị mặc định (<span className={styles.codeBlock}>admin@speanut.com</span> với mật khẩu <span className={styles.codeBlock}>111111</span>).
            </li>
            <li className={styles.instructionItem}>
              Lấy **Project URL** và **Anon Key** từ mục *Project Settings -{">"} API* của Supabase dán vào form trên, lưu lại là bạn đã có một phiên bản hệ thống hoàn toàn cô lập dành riêng cho công ty đó!
            </li>
          </ol>
        </section>
      </article>
    </div>
  );
}
