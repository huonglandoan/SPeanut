import type { ClassEvent, ThemeConfig } from './types.ts';
import { getEventStyle } from './themeConfig';
import { ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';
import { lightTheme, darkTheme } from './themeConfig';

interface DayViewProps {
  events: ClassEvent[];
  selectedDate: Date;
  theme: ThemeConfig;
}

export function DayView({ events, selectedDate, theme }: DayViewProps) {
  const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM

  const dateStr = selectedDate.toISOString().split('T')[0];
  const dayEvents = events.filter(e => e.date === dateStr);

  return (
    <div
      className="flex flex-col h-full overflow-auto"
      style={{
        backgroundColor: theme.bg,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Time slots */}
      <div className="flex-1 relative">
        {hours.map((hour) => (
          <div
            key={hour}
            className="relative"
            style={{
              height: '80px',
              borderBottom: `1px solid ${theme.gridLine}`,
            }}
          >
            <div
              className="absolute left-0 top-0 w-16 text-xs px-2 py-1"
              style={{ color: theme.textMuted }}
            >
              {hour.toString().padStart(2, '0')}:00
            </div>
          </div>
        ))}

        {/* Event blocks */}
        {dayEvents.map((event) => {
          const topOffset = (event.startHour - 8) * 80 + (event.startMinute / 60) * 80;
          const height = event.durationHours * 80;
          const eventStyle = getEventStyle(event.state, theme.isDark);

          return (
            <div
              key={event.id}
              className="absolute left-20 right-4 rounded-lg px-3 py-2"
              style={{
                top: `${topOffset}px`,
                height: `${height}px`,
                backgroundColor: eventStyle.bg,
                borderLeft: `4px solid ${eventStyle.border}`,
                color: eventStyle.text,
                boxShadow: theme.cardShadow,
              }}
            >
              <div className="font-semibold text-sm">{event.title}</div>
              <div className="text-xs mt-1">{event.subject}</div>
              <div className="text-xs mt-1">
                {event.startHour.toString().padStart(2, '0')}:{event.startMinute.toString().padStart(2, '0')} - {Math.floor(event.startHour + event.durationHours).toString().padStart(2, '0')}:{Math.floor((event.startMinute + event.durationHours * 60) % 60).toString().padStart(2, '0')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
