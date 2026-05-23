import type { ClassEvent, ThemeConfig } from './types.ts';
import { getEventStyle } from './themeConfig';

interface WeekViewProps {
  events: ClassEvent[];
  selectedDate: Date;
  theme: ThemeConfig;
}

export function WeekView({ events, selectedDate, theme }: WeekViewProps) {
  const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  // Get the week's date range
  const startOfWeek = new Date(selectedDate);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.date === dateStr);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div
      className="flex flex-col h-full overflow-auto"
      style={{
        backgroundColor: theme.bg,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Week header */}
      <div className="grid grid-cols-7 border-b" style={{ borderColor: theme.border }}>
        {weekDays.map((day, idx) => (
          <div
            key={day}
            className="p-3 text-center"
            style={{
              backgroundColor: theme.headerBg,
              borderRight: idx < 6 ? `1px solid ${theme.border}` : 'none',
            }}
          >
            <div className="text-xs font-medium" style={{ color: theme.textMuted }}>
              {day}
            </div>
            <div
              className="text-lg font-semibold mt-1"
              style={{
                color: isToday(weekDates[idx]) ? theme.todayText : theme.text,
              }}
            >
              {weekDates[idx].getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Week grid */}
      <div className="flex-1 grid grid-cols-7">
        {weekDates.map((date, idx) => {
          const dayEvents = getEventsForDate(date);

          return (
            <div
              key={idx}
              className="p-2 space-y-2 overflow-y-auto"
              style={{
                backgroundColor: isToday(date) ? theme.todayBg : theme.bg,
                borderRight: idx < 6 ? `1px solid ${theme.border}` : 'none',
                minHeight: '400px',
              }}
            >
              {dayEvents.map((event) => {
                const eventStyle = getEventStyle(event.state, theme.isDark);
                return (
                  <div
                    key={event.id}
                    className="rounded px-2 py-1.5 text-xs"
                    style={{
                      backgroundColor: eventStyle.bg,
                      borderLeft: `3px solid ${eventStyle.border}`,
                      color: eventStyle.text,
                    }}
                  >
                    <div className="font-semibold">{event.startHour.toString().padStart(2, '0')}:{event.startMinute.toString().padStart(2, '0')}</div>
                    <div className="truncate">{event.title}</div>
                    <div className="text-[10px] truncate opacity-80">{event.subject}</div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
