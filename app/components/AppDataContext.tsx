'use client';
// app/components/AppDataContext.tsx
// Lưu schedules và profile ở cấp Dashboard, share xuống Calendar và Salary
// để tránh fetch trùng lặp mỗi khi chuyển tab.

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { fetchProfile, type ProfileData } from '../services/profile';

export interface CalendarEventData {
  id: number;
  class_id: number;
  name: string;
  short_name: string;
  rate_per_session: number;
  type: 'FIXED' | 'EXTRA';
  day_of_week: number;
  start_time: string;
  end_time: string;
  valid_from: string;
  valid_to: string | null;
}

interface AppDataContextValue {
  // Schedules
  schedules: CalendarEventData[];
  schedulesLoading: boolean;
  schedulesError: string | null;
  refreshSchedules: () => Promise<void>;

  // Profile
  profile: ProfileData | null;
  profileLoading: boolean;
  setProfile: React.Dispatch<React.SetStateAction<ProfileData | null>>;
  refreshProfile: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [schedules, setSchedules] = useState<CalendarEventData[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [schedulesError, setSchedulesError] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Ref để tránh gọi fetch nhiều lần cùng lúc (deduplication)
  const scheduleFetchRef = useRef(false);
  const profileFetchRef = useRef(false);

  const refreshSchedules = useCallback(async () => {
    if (scheduleFetchRef.current) return; // đã đang fetch
    scheduleFetchRef.current = true;
    setSchedulesLoading(true);
    try {
      // Tour mode: dùng dữ liệu mẫu từ localStorage
      if (typeof window !== 'undefined' && localStorage.getItem('speanut_tour_mode') === 'true') {
        const stored = localStorage.getItem('speanut_tour_schedules');
        if (stored) {
          setSchedules(JSON.parse(stored));
        } else {
          const defaultSchedules: CalendarEventData[] = [
            { id: 9001, class_id: 9001, name: "Toán 7", short_name: "T7", rate_per_session: 150000, type: "FIXED", day_of_week: 1, start_time: "18:00", end_time: "20:00", valid_from: "2026-01-01", valid_to: null },
            { id: 9002, class_id: 9002, name: "Anh 8", short_name: "A8", rate_per_session: 180000, type: "FIXED", day_of_week: 2, start_time: "19:30", end_time: "21:30", valid_from: "2026-01-01", valid_to: null },
            { id: 9003, class_id: 9003, name: "Lý 11", short_name: "L11", rate_per_session: 200000, type: "FIXED", day_of_week: 4, start_time: "17:00", end_time: "19:00", valid_from: "2026-01-01", valid_to: null },
          ];
          setSchedules(defaultSchedules);
          localStorage.setItem('speanut_tour_schedules', JSON.stringify(defaultSchedules));
        }
        setSchedulesError(null);
        return;
      }

      const res = await fetch('/api/calendar');
      if (!res.ok) throw new Error("Lỗi khi tải dữ liệu lịch biểu");
      const data = await res.json();
      setSchedules(data);
      setSchedulesError(null);
    } catch (err: any) {
      setSchedulesError(err.message || "Không thể tải lịch dạy.");
    } finally {
      setSchedulesLoading(false);
      scheduleFetchRef.current = false;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (profileFetchRef.current) return; // đã đang fetch
    profileFetchRef.current = true;
    setProfileLoading(true);
    try {
      const data = await fetchProfile();
      setProfile(data);
    } catch (err) {
      console.error("Lỗi khi tải profile:", err);
    } finally {
      setProfileLoading(false);
      profileFetchRef.current = false;
    }
  }, []);

  return (
    <AppDataContext.Provider value={{
      schedules,
      schedulesLoading,
      schedulesError,
      refreshSchedules,
      profile,
      profileLoading,
      setProfile,
      refreshProfile,
    }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData phải được dùng bên trong <AppDataProvider>');
  return ctx;
}
