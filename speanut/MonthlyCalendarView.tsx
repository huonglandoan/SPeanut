import type { AppTheme, Shift, ClassInfo } from './types';

interface MonthlyCalendarViewProps {
  theme: AppTheme;
  shifts: Shift[];
  classes: ClassInfo[];
  selectedDate: Date;
  onDayClick: (date: string) => void;
}

export function MonthlyCalendarView({ theme, shifts, classes, selectedDate, onDayClick }: MonthlyCalendarViewProps) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  // Get first and last day of month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Get day of week for first day (0 = Sun, 1 = Mon, etc.)
  const startDay = firstDay.getDay();
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

  // Next month days to fill grid (always 35 or 42 cells)
  const totalCells = calendarDays.length <= 35 ? 35 : 42;
  const remainingDays = totalCells - calendarDays.length;
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }

  const getShiftsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return shifts.filter(s => s.date === dateStr);
  };

  const getClassById = (classId: string) => {
    return classes.find(c => c.id === classId);
  };

  const getPillStyle = (status: Shift['status']) => {
    switch (status) {
      case 'fixed':
        return {
          bg: theme.pillGreen,
          text: theme.pillGreenText,
        };
      case 'extra':
        return {
          bg: theme.pillYellow,
          text: theme.pillYellowText,
        };
      case 'cancelled':
        return {
          bg: theme.pillRed,
          text: theme.pillRedText,
        };
    }
  };

  const numRows = totalCells / 7;

  return (
    <div
      className="rounded-lg overflow-hidden border w-full"
      style={{
        backgroundColor: theme.cardBg,
        boxShadow: theme.cardShadow,
        fontFamily: 'Inter, sans-serif',
        borderColor: theme.border,
      }}
    >
      {/* Weekday headers */}
      <div
        className="grid grid-cols-7"
        style={{
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, idx) => (
          <div
            key={day}
            className="p-2 md:p-3 text-center text-[10px] md:text-xs font-semibold"
            style={{
              color: theme.textMuted,
              backgroundColor: theme.surface,
              borderRight: idx < 6 ? `1px solid ${theme.border}` : 'none',
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div
        className="grid grid-cols-7"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridTemplateRows: `repeat(${numRows}, 1fr)`,
        }}
      >
        {calendarDays.map((day, idx) => {
          const dayShifts = getShiftsForDate(day.date);
          const isToday = day.date.toDateString() === new Date().toDateString();
          const row = Math.floor(idx / 7);
          const col = idx % 7;

          return (
            <div
              key={idx}
              onClick={() => day.isCurrentMonth && onDayClick(day.date.toISOString().split('T')[0])}
              className="p-1.5 md:p-2 cursor-pointer transition-colors flex flex-col"
              style={{
                borderRight: col < 6 ? `1px solid ${theme.border}` : 'none',
                borderBottom: row < numRows - 1 ? `1px solid ${theme.border}` : 'none',
                backgroundColor: day.isCurrentMonth
                  ? isToday
                    ? theme.surfaceHover
                    : theme.cardBg
                  : theme.bg,
                minHeight: '80px',
                maxHeight: '140px',
                height: '100%',
              }}
              onMouseEnter={(e) => {
                if (day.isCurrentMonth) {
                  e.currentTarget.style.backgroundColor = theme.surfaceHover;
                }
              }}
              onMouseLeave={(e) => {
                if (day.isCurrentMonth) {
                  e.currentTarget.style.backgroundColor = isToday ? theme.surfaceHover : theme.cardBg;
                }
              }}
            >
              {/* Day number */}
              <div
                className="text-xs md:text-sm font-medium mb-1 flex-shrink-0"
                style={{
                  color: day.isCurrentMonth
                    ? isToday
                      ? theme.buttonPrimary
                      : theme.text
                    : theme.textSubtle,
                }}
              >
                {day.date.getDate()}
              </div>

              {/* Shift pills */}
              <div className="flex flex-col gap-0.5 md:gap-1 overflow-hidden flex-1">
                {dayShifts.slice(0, 4).map((shift) => {
                  const classInfo = getClassById(shift.classId);
                  const pillStyle = getPillStyle(shift.status);

                  return (
                    <div
                      key={shift.id}
                      className="px-1 md:px-1.5 py-0.5 rounded-sm text-[9px] md:text-[10px] font-medium truncate leading-tight flex-shrink-0"
                      style={{
                        backgroundColor: pillStyle.bg,
                        color: pillStyle.text,
                        textDecoration: shift.status === 'cancelled' ? 'line-through' : 'none',
                        opacity: shift.status === 'cancelled' ? 0.6 : 1,
                      }}
                    >
                      {classInfo?.abbreviation || 'N/A'}
                    </div>
                  );
                })}
                {dayShifts.length > 4 && (
                  <div className="text-[8px] md:text-[9px] px-1 flex-shrink-0" style={{ color: theme.textSubtle }}>
                    +{dayShifts.length - 4}
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
