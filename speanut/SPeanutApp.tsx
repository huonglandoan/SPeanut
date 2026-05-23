'use client';

import { useState } from 'react';
import { Sun, Moon, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AppTheme, Shift, ClassInfo, ShiftStatus, DayOfWeek, SalaryMetrics } from './types';
import { lightTheme, darkTheme } from './theme';
import { mockClasses as initialClasses, mockShifts as initialShifts, mockSalaryMetrics } from './mockData';
import { MonthlyCalendarView } from './MonthlyCalendarView';
import { ShiftDetailPanel } from './ShiftDetailPanel';
import { SalaryDashboard } from './SalaryDashboard';

export function SPeanutApp() {
  const [isDark, setIsDark] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 4, 1)); // May 2026
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [classes, setClasses] = useState<ClassInfo[]>(initialClasses);

  const theme: AppTheme = isDark ? darkTheme : lightTheme;

  const handleDayClick = (date: string) => {
    setSelectedDay(date);
  };

  const handleClosePanel = () => {
    setSelectedDay(null);
  };

  const handleDeleteShift = (shiftId: string) => {
    setShifts(shifts.filter(s => s.id !== shiftId));
  };

  const handleMarkCancelled = (shiftId: string) => {
    setShifts(shifts.map(s =>
      s.id === shiftId ? { ...s, status: 'cancelled' as ShiftStatus } : s
    ));
  };

  const handleAddShift = (classId: string, status: ShiftStatus, recurringDays?: DayOfWeek[]) => {
    if (!selectedDay) return;

    const newShift: Shift = {
      id: Date.now().toString(),
      classId,
      date: selectedDay,
      status,
      hours: 2,
      isRecurring: !!recurringDays && recurringDays.length > 0,
      recurringDays,
    };

    setShifts([...shifts, newShift]);
  };

  const handleAddClass = (name: string, abbreviation: string, rate: number) => {
    const newClass: ClassInfo = {
      id: Date.now().toString(),
      name,
      abbreviation,
      rate,
    };
    setClasses([...classes, newClass]);
  };

  const handleDeleteClass = (classId: string) => {
    setClasses(classes.filter(c => c.id !== classId));
    setShifts(shifts.filter(s => s.classId !== classId));
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const formattedMonth = selectedDate.toLocaleDateString('vi-VN', {
    month: 'long',
    year: 'numeric',
  });

  // Calculate salary metrics dynamically
  const calculateMetrics = (): SalaryMetrics => {
    const monthShifts = shifts.filter(s => {
      const shiftDate = new Date(s.date);
      return shiftDate.getMonth() === selectedDate.getMonth() &&
             shiftDate.getFullYear() === selectedDate.getFullYear();
    });

    const completedShifts = monthShifts.filter(s => s.status !== 'cancelled');
    const extraShifts = monthShifts.filter(s => s.status === 'extra');

    let totalPayout = 0;
    completedShifts.forEach(shift => {
      const classInfo = classes.find(c => c.id === shift.classId);
      if (classInfo) {
        totalPayout += classInfo.rate * shift.hours;
      }
    });

    let extraBonus = 0;
    extraShifts.forEach(shift => {
      const classInfo = classes.find(c => c.id === shift.classId);
      if (classInfo) {
        extraBonus += classInfo.rate * shift.hours;
      }
    });

    return {
      totalPayout,
      totalSessions: completedShifts.length,
      extraBonus,
      completedSessions: completedShifts.length,
      expectedSessions: 20,
      monthStatus: 'counting',
    };
  };

  const metrics = calculateMetrics();

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: theme.bg,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Header */}
      <div
        className="border-b sticky top-0 z-30"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
        }}
      >
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-3 md:gap-3">
              <div
                className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-lg md:text-xl"
                style={{
                  backgroundColor: isDark ? '#0bedf5ff' : '#fbbf24',
                }}
              >
                🥜
              </div>
              <div>
                <h1 className="text-base md:text-lg font-bold" style={{ color: theme.text }}>
                  SPeanut
                </h1>
                <p className="text-[10px] md:text-xs" style={{ color: theme.textMuted }}>
                  Quản lý lương trợ giảng
                </p>
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-colors"
              style={{
                backgroundColor: theme.surfaceHover,
                color: theme.text,
              }}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
        {/* Calendar Section */}
        <div>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold capitalize" style={{ color: theme.text }}>
              Tháng {formattedMonth}
            </h2>
            <div className="flex items-center gap-1 md:gap-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity"
                style={{
                  backgroundColor: theme.surface,
                  color: theme.text,
                }}
              >
                <ChevronLeft size={16} className="md:w-[18px] md:h-[18px]" />
              </button>
              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: theme.surface,
                  color: theme.text,
                }}
              >
                Hôm nay
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity"
                style={{
                  backgroundColor: theme.surface,
                  color: theme.text,
                }}
              >
                <ChevronRight size={16} className="md:w-[18px] md:h-[18px]" />
              </button>
            </div>
          </div>

          {/* Calendar */}
          <MonthlyCalendarView
            theme={theme}
            shifts={shifts}
            classes={classes}
            selectedDate={selectedDate}
            onDayClick={handleDayClick}
          />
        </div>

        {/* Salary Dashboard Section */}
        <div>
          <SalaryDashboard theme={theme} metrics={metrics} />
        </div>
      </div>

      {/* Shift Detail Panel */}
      {selectedDay && (
        <ShiftDetailPanel
          theme={theme}
          selectedDate={selectedDay}
          shifts={shifts}
          classes={classes}
          onClose={handleClosePanel}
          onDeleteShift={handleDeleteShift}
          onAddShift={handleAddShift}
          onAddClass={handleAddClass}
          onDeleteClass={handleDeleteClass}
          onMarkCancelled={handleMarkCancelled}
        />
      )}
    </div>
  );
}
