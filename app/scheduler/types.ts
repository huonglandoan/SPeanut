export type EventState = 'green' | 'yellow' | 'red';
export type ViewMode = 'day' | 'week' | 'month' | 'year';

export interface ClassEvent {
  id: string;
  title: string;
  subject: string;
  startHour: number;
  startMinute: number;
  durationHours: number;
  state: EventState;
  date: string;
}

export interface ThemeConfig {
  isDark: boolean;
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  segBg: string;
  segActiveBg: string;
  segActiveText: string;
  segText: string;
  inputBg: string;
  inputText: string;
  inputBorder: string;
  gridLine: string;
  todayBg: string;
  todayText: string;
  headerBg: string;
  shadow: string;
  cardShadow: string;
  panelShadow: string;
  outOfMonthBg: string;
}

export interface EventStyle {
  bg: string;
  text: string;
  border: string;
  pillBg: string;
  pillText: string;
  dot: string;
}
