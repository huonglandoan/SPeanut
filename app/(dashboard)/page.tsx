'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase';
import styles from '../styles/Dashboard.module.css'
import Scheduler from './class'
import CalendarView from './calendar'
import SalaryView from './salary'
import ProfileView from './profile'
import Image from 'next/image'
import { PeanutLoader } from '../components/Loader'
import { InteractiveTour, ClassTour } from '../components/Guide'
import AiAssistant from '../components/AiAssistant'

import { BookOpen, Calendar, Wallet, User, Heart } from "lucide-react";

const NAV_ICONS = [BookOpen, Calendar, Wallet, User];
const NAV_LABELS = ["Class", "Calendar", "Wallet", "Profile"];
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth() + 1)
  const [selected, setSelected] = useState(() => new Date().getDate())
  const [activeNav, setActiveNav] = useState(1)
  const [isAiOpen, setIsAiOpen] = useState(false)
  
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      // Lấy thông tin phiên đăng nhập từ Supabase
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // Không có session -> Đẩy người dùng về trang /login ngay
        router.push('/login')
      } else if (session.user.email === 'admin@speanut.com' || session.user.email === '111111@speanut.com') {
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
      } else if (session && (session.user.email === 'admin@speanut.com' || session.user.email === '111111@speanut.com')) {
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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('speanut_tour_event', { detail: { type: 'theme_changed', mode } }));
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

  // Lắng nghe sự thay đổi navigation để tour tự động chuyển bước
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('speanut_tour_event', { detail: { type: 'nav_changed', activeNav } }));
    }
  }, [activeNav]);

  if (loading) {
    return <PeanutLoader text="Đang tải dữ liệu SPeanut..." fullscreen />;
  }

  return (
   <div className={styles.wrapper}>
    <div className={styles.topHeader}>
      <div id="top-left-portal-root" />
      <div className={styles.switchContainer} id="tour-theme-switcher">
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
        <SalaryView 
          activeNav={activeNav} 
          year={year}
          setYear={setYear}
          month={month}
          setMonth={setMonth}
        />
      </div>
      <div style={{ display: activeNav === 3 ? 'block' : 'none', width: '100%' }}>
        <ProfileView activeNav={activeNav} setActiveNav={setActiveNav} />
      </div>
    </div>

    <div className={styles.bottomShell}>
      <button id="tour-ai-trigger" className={styles.fab} aria-label="Add event" onClick={() => setIsAiOpen(true)}><Heart /></button>
      <nav className={styles.bottomBar} aria-label="Main navigation">
        <div className={styles.navRow}>
          <div className={styles.navGroup}>
            {[0, 1].map((i) => {
              const Icon = NAV_ICONS[i];
              return (
                <button 
                  key={i} 
                  id={`tour-nav-${NAV_LABELS[i].toLowerCase()}`}
                  className={`${styles.navBtn}${activeNav === i ? ` ${styles.active}` : ""}`} 
                  onClick={() => setActiveNav(i)} 
                  aria-label={NAV_LABELS[i]}
                >
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
                <button 
                  key={i} 
                  id={`tour-nav-${NAV_LABELS[i].toLowerCase()}`}
                  className={`${styles.navBtn}${activeNav === i ? ` ${styles.active}` : ""}`} 
                  onClick={() => setActiveNav(i)} 
                  aria-label={NAV_LABELS[i]}
                >
                  <Icon strokeWidth={activeNav === i ? 2.2 : 1.8} />
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
    <InteractiveTour activeNav={activeNav} setActiveNav={setActiveNav} />
    <ClassTour activeNav={activeNav} />
    <AiAssistant isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
   </div>
  );
}