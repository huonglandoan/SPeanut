export type ShiftStatus = 'fixed' | 'extra' | 'cancelled';
export type MonthStatus = 'counting' | 'locked' | 'paid';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.

export interface ClassInfo {
  id: string;
  name: string;
  abbreviation: string;
  rate: number; // hourly rate
}

export interface Shift {
  id: string;
  classId: string;
  date: string; // YYYY-MM-DD
  status: ShiftStatus;
  hours: number;
  isRecurring?: boolean;
  recurringDays?: DayOfWeek[];
}

export interface SalaryMetrics {
  totalPayout: number;
  totalSessions: number;
  extraBonus: number;
  completedSessions: number;
  expectedSessions: number;
  monthStatus: MonthStatus;
}

export interface AppTheme {
  isDark: boolean;
  bg: string;
  surface: string;
  surfaceHover: string;
  border: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  cardBg: string;
  cardShadow: string;
  modalBg: string;
  modalOverlay: string;
  inputBg: string;
  inputBorder: string;
  buttonPrimary: string;
  buttonPrimaryText: string;
  buttonSecondary: string;
  buttonSecondaryText: string;
  pillGreen: string;
  pillGreenText: string;
  pillYellow: string;
  pillYellowText: string;
  pillRed: string;
  pillRedText: string;
  progressBg: string;
  progressGreen: string;
  progressYellow: string;
  badgeCounting: string;
  badgeCountingText: string;
  badgeLocked: string;
  badgeLockedText: string;
  badgePaid: string;
  badgePaidText: string;
}
