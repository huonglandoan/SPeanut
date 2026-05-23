import type { ClassEvent, ThemeConfig } from './types.ts';
import { getEventStyle } from './themeConfig';

interface YearViewProps {
  events: ClassEvent[];
  selectedDate: Date;
  theme: ThemeConfig;
}

export function YearView({ events, selectedDate, theme }: YearViewProps) {
  const year = selectedDate.getFullYear();
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const getEventsForDate = (month: number, day: number) => {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.date === dateStr);
  };

  return (
    <div
      className="overflow-auto p-4"
      style={{
        backgroundColor: theme.bg,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div className="grid grid-cols-3 gap-4">
        {months.map((monthName, monthIdx) => {
          const daysInMonth = getDaysInMonth(monthIdx);
          const firstDay = getFirstDayOfMonth(monthIdx);

          const days = [];
          // Empty cells before first day
          for (let i = 0; i < firstDay; i++) {
            days.push(null);
          }
          // Actual days
          for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
          }

          return (
            <div
              key={monthIdx}
              className="rounded-lg p-3"
              style={{
                backgroundColor: theme.surface,
                border: `1px solid ${theme.border}`,
              }}
            >
              {/* Month name */}
              <div className="text-xs font-semibold mb-2" style={{ color: theme.text }}>
                {monthName}
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <div
                    key={i}
                    className="text-center text-[9px]"
                    style={{ color: theme.textSubtle }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} />;
                  }

                  const dayEvents = getEventsForDate(monthIdx, day);
                  const hasGreen = dayEvents.some(e => e.state === 'green');
                  const hasYellow = dayEvents.some(e => e.state === 'yellow');
                  const hasRed = dayEvents.some(e => e.state === 'red');

                  return (
                    <div
                      key={idx}
                      className="aspect-square flex flex-col items-center justify-center rounded text-[9px] relative"
                      style={{
                        backgroundColor: dayEvents.length > 0 ? theme.surfaceAlt : 'transparent',
                        color: theme.text,
                      }}
                    >
                      <span>{day}</span>
                      {/* Event dots */}
                      {dayEvents.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5">
                          {hasGreen && (
                            <div
                              className="w-1 h-1 rounded-full"
                              style={{
                                backgroundColor: getEventStyle('green', theme.isDark).dot,
                              }}
                            />
                          )}
                          {hasYellow && (
                            <div
                              className="w-1 h-1 rounded-full"
                              style={{
                                backgroundColor: getEventStyle('yellow', theme.isDark).dot,
                              }}
                            />
                          )}
                          {hasRed && (
                            <div
                              className="w-1 h-1 rounded-full"
                              style={{
                                backgroundColor: getEventStyle('red', theme.isDark).dot,
                              }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
