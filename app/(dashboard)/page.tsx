'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase';
import styles from '../styles/Dashboard.module.css'
import Scheduler from './class'
import CalendarView from './calendar'
import SalaryView from './salary'
import ProfileView from './profile'

import { BookOpen, Calendar, Wallet, User, Heart } from "lucide-react";

const NAV_ICONS = [BookOpen, Calendar, Wallet, User];
const NAV_LABELS = ["Class", "Calendar", "Wallet", "Profile"];
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(4)
  const [selected, setSelected] = useState(2)
  const [activeNav, setActiveNav] = useState(1)
  
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      // Lấy thông tin phiên đăng nhập từ Supabase
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // Không có session -> Đẩy người dùng về trang /login ngay
        router.push('/login')
      } else if (session.user.email === 'admin@speanut.com') {
        // Nếu là admin -> Chuyển hướng thẳng sang trang quản trị /admin
        router.push('/admin')
      } else {
        setLoading(false)
      }
    }

    checkAuth()

    // Lắng nghe trạng thái đăng xuất đột ngột
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login')
      } else if (session && session.user.email === 'admin@speanut.com') {
        router.push('/admin')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleToggleTheme = (mode: 'light' | 'dark') => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Đồng bộ tiêu đề trang web nếu có cấu hình nhãn hiệu riêng
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const customName = localStorage.getItem('speanut_config_company_name');
      if (customName) {
        document.title = customName;
      }
    }
  }, []);

  // Nếu đang kiểm tra thông tin, hiện màn hình chờ với peanut xoay tròn
  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#fdf6ec',
        zIndex: 9999,
      }}>
        <style>{`
          @keyframes spin-peanut {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          overflow: 'hidden',
          animation: 'spin-peanut 1.2s linear infinite',
          flexShrink: 0,
        }}>
          <img
            src="/peanut.png"
            alt="SPeanut"
            style={{
              width: '110%',
              height: '110%',
              objectFit: 'cover',
              objectPosition: 'center',
              marginLeft: '-5%',
              marginTop: '-5%',
              display: 'block',
            }}
          />
        </div>
      </div>
    )
  }

  return (
   <div className={styles.wrapper}>
    <div className={styles.topHeader}>
      <div id="top-left-portal-root" />
      <div className={styles.switchContainer}>
        <div className={styles.slider} />
        <button type="button" className={styles.switchBtn} onClick={() => handleToggleTheme('light')}>☀️</button>
        <button type="button" className={styles.switchBtn} onClick={() => handleToggleTheme('dark')}>🌙</button>
      </div>
    </div>

    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', paddingBottom: '40px' }}>
      <div style={{ display: activeNav === 0 ? 'block' : 'none', width: '100%' }}>
        <Scheduler activeNav={activeNav} />
      </div>
      <div style={{ display: activeNav === 1 ? 'block' : 'none', width: '100%' }}>
        <CalendarView 
          year={year} 
          setYear={setYear} 
          month={month} 
          setMonth={setMonth} 
          selected={selected} 
          setSelected={setSelected}
          activeNav={activeNav} 
        />
      </div>
      <div style={{ display: activeNav === 2 ? 'block' : 'none', width: '100%' }}>
        <SalaryView activeNav={activeNav} />
      </div>
      <div style={{ display: activeNav === 3 ? 'block' : 'none', width: '100%' }}>
        <ProfileView activeNav={activeNav} />
      </div>
    </div>

    <div className={styles.bottomShell}>
      <button className={styles.fab} aria-label="Add event"><Heart /></button>
      <nav className={styles.bottomBar} aria-label="Main navigation">
        <div className={styles.navRow}>
          <div className={styles.navGroup}>
            {[0, 1].map((i) => {
              const Icon = NAV_ICONS[i];
              return (
                <button key={i} className={`${styles.navBtn}${activeNav === i ? ` ${styles.active}` : ""}`} onClick={() => setActiveNav(i)} aria-label={NAV_LABELS[i]}>
                  <Icon strokeWidth={activeNav === i ? 2.2 : 1.8} />
                </button>
              );
            })}
          </div>
          <div className={styles.navGap} />
          <div className={styles.navGroup}>
            {[2, 3].map((i) => {
              const Icon = NAV_ICONS[i];
              return (
                <button key={i} className={`${styles.navBtn}${activeNav === i ? ` ${styles.active}` : ""}`} onClick={() => setActiveNav(i)} aria-label={NAV_LABELS[i]}>
                  <Icon strokeWidth={activeNav === i ? 2.2 : 1.8} />
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
   </div>
  );
}