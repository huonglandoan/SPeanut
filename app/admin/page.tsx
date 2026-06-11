'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminDashboardView from '../(dashboard)/admin';

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Chưa đăng nhập -> Đẩy về trang đăng nhập
        router.push('/login');
        return;
      }

      if (session.user.email !== 'admin@speanut.com' && session.user.email !== '111111@speanut.com') {
        // Đã đăng nhập nhưng không phải tài khoản admin -> Đẩy về trang chủ của giáo viên
        alert('Bạn không có quyền truy cập trang quản trị!');
        router.push('/');
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    };

    checkAdmin();

    // Lắng nghe trạng thái đăng xuất hoặc thay đổi session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      } else if (session && session.user.email !== 'admin@speanut.com' && session.user.email !== '111111@speanut.com') {
        router.push('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--background)' }}>
        <p style={{ fontSize: '16px', color: 'var(--muted-foreground)' }}>Đang xác thực quyền Admin...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div style={{ padding: '24px 16px 100px 16px', maxWidth: '1280px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <AdminDashboardView onLogout={() => router.push('/login')} />
    </div>
  );
}
