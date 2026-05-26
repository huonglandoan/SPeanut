'use client'
import {useState, useEffect} from 'react'
//import {useRouter} from 'next/navigation'
import {supabase} from '@/lib/supabase'
import styles from '../styles/Dashboard.module.css'
import Scheduler from './schedule'
import CalendarView from './calendar'

import {
  Sun, Moon, Plus, Calendar, Clock, Bell, User,
  ChevronLeft, ChevronRight,
} from "lucide-react";


const NAV_ICONS = [Calendar, Clock, Bell, User];
const NAV_LABELS = ["Calendar", "Schedule", "Notifications", "Profile"];

export default function DashboardPage(){
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(4)
  const [selected, setSelected] = useState(2)
  const [activeNav, setActiveNav] = useState(3)
  const [mounted, setMounted] = useState(false)
  //const router = useRouter();
  useEffect(() => {
    setMounted(true)
  }, [])
  const renderContent = () => {
    switch (activeNav) {
      case 0:
        return <Scheduler />
      case 1:
        <div>Màn hình Thông báo (Đang phát triển)</div>
      case 2:
        return <div>Màn hình Thông báo (Đang phát triển)</div>
      case 3:
        return <CalendarView
            year={year} 
            setYear={setYear}
            month={month} 
            setMonth={setMonth} 
            selected={selected} 
            setSelected={setSelected} />
      default:
        return <div>Màn hình Thông báo (Đang phát triển)</div>
    }
  }
  const handleToggleTheme = (mode: 'light' | 'dark') => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

  };

  return (
   <div className={styles.wrapper}>
    <div className={styles.switchContainer}>
    <div className={styles.slider} />
    <button type="button" className={styles.switchBtn} onClick={() => handleToggleTheme('light')}>☀️</button>
    <button type="button" className={styles.switchBtn} onClick={() => handleToggleTheme('dark')}>🌙</button>
  </div>

{renderContent()}
    <div className={styles.bottomShell}>
      <button className={styles.fab} aria-label="Add event">
        <Plus />
      </button>

      <nav className={styles.bottomBar} aria-label="Main navigation">
        <div className={styles.navRow}>
          {/* Left pair: Calendar, Schedule */}
          <div className={styles.navGroup}>
            {[0, 1].map((i) => {
              const Icon = NAV_ICONS[i];
              return (
                <button
                  key={i}
                  className={`${styles.navBtn}${activeNav === i ? ` ${styles.active}` : ""}`}
                  onClick={() => setActiveNav(i)}
                  aria-label={NAV_LABELS[i]}
                >
                  <Icon strokeWidth={activeNav === i ? 2.2 : 1.8} />
                </button>
              );
            })}
          </div>

          {/* Gap for FAB */}
          <div className={styles.navGap} />

          {/* Right pair: Bell, User */}
          <div className={styles.navGroup}>
            {[2, 3].map((i) => {
              const Icon = NAV_ICONS[i];
              return (
                <button
                  key={i}
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
   </div>
  );
}