'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import styles from '../styles/Dashboard.module.css'
import Scheduler from './class'
import CalendarView from './calendar'

import { BookOpen, Calendar, Wallet, User, Heart } from "lucide-react";

const NAV_ICONS = [BookOpen, Calendar, Wallet, User];
const NAV_LABELS = ["Class", "Calendar", "Notifications", "Profile"];

export default function DashboardPage() {
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(4)
  const [selected, setSelected] = useState(2)
  const [activeNav, setActiveNav] = useState(3)
  
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      // 1. Lấy thông tin phiên đăng nhập từ Supabase
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // 2. Không có session -> Đẩy người dùng về trang /login ngay
        router.push('/login')
      } else {
        setLoading(false)
      }
    }

    checkAuth()

    // Lắng nghe trạng thái đăng xuất đột ngột
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push('/login')
    })

    return () => subscription.unsubscribe()
  }, [router])

  const renderContent = () => {
    switch (activeNav) {
      case 0:
        return <Scheduler />
      case 1:
        return <CalendarView year={year} setYear={setYear} month={month} setMonth={setMonth} selected={selected} setSelected={setSelected} />
      case 2:
        return <div>Màn hình Thông báo (Đang phát triển)</div>
      case 3:
        return (
          <div>
            <h3>Màn hình Profile</h3>
            <button onClick={() => supabase.auth.signOut()} style={{ padding: '8px 16px', backgroundColor: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Đăng xuất (Sign Out)
            </button>
          </div>
        )
      default:
        return <div>Màn hình Thông báo (Đang phát triển)</div>
    }
  }

  const handleToggleTheme = (mode: 'light' | 'dark') => {
    if (mode === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  // Nếu đang kiểm tra thông tin, hiện màn hình chờ trắng để bảo mật, không cho xem trước Dashboard
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#fff' }}>
        <p style={{ fontSize: '16px', color: '#666' }}>Đang xác thực quyền truy cập SPeanut...</p>
      </div>
    )
  }

  return (
   <div className={styles.wrapper}>
    <div className={styles.switchContainer}>
      <div className={styles.slider} />
      <button type="button" className={styles.switchBtn} onClick={() => handleToggleTheme('light')}>☀️</button>
      <button type="button" className={styles.switchBtn} onClick={() => handleToggleTheme('dark')}>🌙</button>
    </div>

    {renderContent()}

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