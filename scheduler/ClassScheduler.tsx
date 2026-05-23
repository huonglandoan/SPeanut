import { useState } from 'react';
import { ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';
import type { ViewMode, ThemeConfig } from './types';
import { lightTheme, darkTheme } from './themeConfig';
import { mockEvents } from './mockData';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import { YearView } from './YearView';
import { StateLegend } from './StateLegend';
import { ScheduleFormPanel } from './ScheduleFormPanel';

interface ClassSchedulerProps {
  isDarkMode: boolean;
}

export function ClassScheduler({ isDarkMode }: ClassSchedulerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showFormPanel, setShowFormPanel] = useState(false);

  const theme: ThemeConfig = isDarkMode ? darkTheme : lightTheme;

  const formatDateHeader = () => {
    const options: Intl.DateTimeFormatOptions = {};

    switch (viewMode) {
      case 'day':
        return selectedDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case 'week':
        return `Week of ${selectedDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })}`;
      case 'month':
        return selectedDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long'
        });
      case 'year':
        return selectedDate.getFullYear().toString();
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);

    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
        break;
    }

    setSelectedDate(newDate);
  };

  const renderView = () => {
    const props = { events: mockEvents, selectedDate, theme };

    switch (viewMode) {
      case 'day':
        return <DayView {...props} />;
      case 'week':
        return <WeekView {...props} />;
      case 'month':
        return <MonthView {...props} />;
      case 'year':
        return <YearView {...props} />;
    }
  };

  return (
    <div
      className="flex flex-col"
      style={{
        backgroundColor: theme.bg,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.headerBg,
        }}
      >
        {/* Left: Logo and Title */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
            style={{
              backgroundColor: theme.isDark ? '#f59e0b' : '#fbbf24',
            }}
          >
            🥜
          </div>
          <h1 className="text-xl font-semibold" style={{ color: theme.text }}>
            Class Scheduler
          </h1>
        </div>

        {/* Right: View Mode Selector */}
        <div className="flex items-center gap-3">
          {/* Segmented Control */}
          <div
            className="inline-flex rounded-lg p-1"
            style={{ backgroundColor: theme.segBg }}
          >
            {(['day', 'week', 'month', 'year'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="px-4 py-1.5 rounded text-sm font-medium transition-all capitalize"
                style={{
                  backgroundColor: viewMode === mode ? theme.segActiveBg : 'transparent',
                  color: viewMode === mode ? theme.segActiveText : theme.segText,
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Calendar View */}
        <div className="flex-1 overflow-auto min-h-0">
          {renderView()}
        </div>

        {/* Right Sidebar */}
        <div
          className="w-full md:w-80 border-t md:border-t-0 md:border-l p-4 space-y-4 overflow-y-auto"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.surfaceAlt,
          }}
        >
          <StateLegend theme={theme} />

          {showFormPanel && (
            <ScheduleFormPanel theme={theme} onClose={() => setShowFormPanel(false)} />
          )}
        </div>
      </div>
    </div>
  );
}
