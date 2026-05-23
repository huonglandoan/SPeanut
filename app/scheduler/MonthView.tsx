import type { ClassEvent, ThemeConfig } from './types.ts';
import { Moon, Sun } from 'lucide-react';
import { getEventStyle } from './themeConfig';

interface MonthViewProps {
  events: ClassEvent[];
  selectedDate: Date;
  theme: ThemeConfig;
}

export function MonthView({ events, selectedDate, theme }: MonthViewProps) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  // Get first day of month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Get day of week for first day (0 = Sun, 1 = Mon, etc.)
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  // Calculate days to show from previous month
  const prevMonthDays = startDay === 0 ? 6 : startDay - 1;

  // Build calendar grid
  const calendarDays: Array<{ date: Date; isCurrentMonth: boolean }> = [];

  // Previous month days
  const prevMonth = new Date(year, month, 0);
  const prevMonthLastDay = prevMonth.getDate();
  for (let i = prevMonthDays - 1; i >= 0; i--) {
    calendarDays.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    });
  }

  // Next month days to fill grid (35 or 42 cells)
  const totalCells = calendarDays.length <= 35 ? 35 : 42;
  const remainingDays = totalCells - calendarDays.length;
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.date === dateStr);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const weekdayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  return (
    <div
      className="flex flex-col h-full rounded-xl overflow-hidden"
      style={{
        backgroundColor: theme.surface,
        fontFamily: 'Inter, sans-serif',
        border: `1px solid ${theme.border}`,
      }}
    >
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b" style={{ borderColor: theme.border }}>
        {weekdayLabels.map((day, idx) => (
          <div
            key={day}
            className="p-3 text-center"
            style={{
              color: theme.textMuted,
              backgroundColor: theme.headerBg,
              borderRight: idx < 6 ? `1px solid ${theme.border}` : 'none',
            }}
          >
            <div className="flex items-center justify-center gap-1 text-[11px] uppercase font-semibold">
              {idx === 5 && <Sun size={14} />}
              {idx === 6 && <Moon size={14} />}
              {day}
            </div>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div
        className="flex-1 grid grid-cols-7"
        style={{
          gridTemplateRows: `repeat(${totalCells / 7}, minmax(90px, 1fr))`,
        }}
      >
        {calendarDays.map((day, idx) => {
          const dayEvents = getEventsForDate(day.date);
          const today = isToday(day.date);
          const row = Math.floor(idx / 7);
          const col = idx % 7;

          return (
            <div
              key={idx}
              className="p-3 border-t overflow-hidden flex flex-col"
              style={{
                borderColor: theme.border,
                borderRight: col < 6 ? `1px solid ${theme.border}` : 'none',
                backgroundColor: day.isCurrentMonth
                  ? today
                    ? theme.todayBg
                    : theme.surface
                  : theme.outOfMonthBg,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="text-sm font-semibold"
                  style={{
                    color: day.isCurrentMonth
                      ? today
                        ? theme.todayText
                        : theme.text
                      : theme.textSubtle,
                  }}
                >
                  {day.date.getDate()}
                </div>
                {today && (
                  <div
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      backgroundColor: theme.isDark ? '#1f2937' : '#bfdbfe',
                      color: theme.isDark ? '#bfdbfe' : theme.todayText,
                    }}
                  >
                    Today
                  </div>
                )}
              </div>

              <div className="space-y-1 overflow-hidden flex-1">
                {dayEvents.slice(0, 3).map((event) => {
                  const eventStyle = getEventStyle(event.state, theme.isDark);
                  return (
                    <div
                      key={event.id}
                      className="rounded-lg px-2 py-1 text-[10px] truncate"
                      style={{
                        backgroundColor: eventStyle.pillBg,
                        color: eventStyle.pillText,
                        borderLeft: `3px solid ${eventStyle.border}`,
                      }}
                    >
                      {event.startHour.toString().padStart(2, '0')}:{event.startMinute.toString().padStart(2, '0')}
                      {' '}
                      {event.title}
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] px-1 mt-1" style={{ color: theme.textMuted }}>
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
