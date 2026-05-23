import type { ThemeConfig, EventStyle, EventState } from './types.ts'

export const lightTheme: ThemeConfig = {
  isDark: false,
  bg: '#ffffff',
  surface: '#ffffff',
  surfaceAlt: '#f8f9fa',
  border: '#e5e7eb',
  borderStrong: '#d1d5db',
  text: '#111827',
  textMuted: '#6b7280',
  textSubtle: '#9ca3af',
  segBg: '#f3f4f6',
  segActiveBg: '#111827',
  segActiveText: '#ffffff',
  segText: '#6b7280',
  inputBg: '#f9fafb',
  inputText: '#111827',
  inputBorder: '#d1d5db',
  gridLine: '#e5e7eb',
  todayBg: '#dbeafe',
  todayText: '#1e40af',
  headerBg: '#f9fafb',
  shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  cardShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  panelShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  outOfMonthBg: '#f9fafb',
};

export const darkTheme: ThemeConfig = {
  isDark: true,
  bg: '#0f172a',
  surface: '#1e293b',
  surfaceAlt: '#334155',
  border: '#334155',
  borderStrong: '#475569',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  textSubtle: '#64748b',
  segBg: '#1e293b',
  segActiveBg: '#f1f5f9',
  segActiveText: '#0f172a',
  segText: '#94a3b8',
  inputBg: '#1e293b',
  inputText: '#f1f5f9',
  inputBorder: '#475569',
  gridLine: '#334155',
  todayBg: '#1e3a8a',
  todayText: '#93c5fd',
  headerBg: '#1e293b',
  shadow: '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
  cardShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
  panelShadow: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
  outOfMonthBg: '#1e293b',
};

export const getLightEventStyle = (state: EventState): EventStyle => {
  switch (state) {
    case 'green':
      return {
        bg: '#d1fae5',
        text: '#065f46',
        border: '#10b981',
        pillBg: '#d1fae5',
        pillText: '#065f46',
        dot: '#10b981',
      };
    case 'yellow':
      return {
        bg: '#fef3c7',
        text: '#92400e',
        border: '#f59e0b',
        pillBg: '#fef3c7',
        pillText: '#92400e',
        dot: '#f59e0b',
      };
    case 'red':
      return {
        bg: '#fee2e2',
        text: '#991b1b',
        border: '#ef4444',
        pillBg: '#fee2e2',
        pillText: '#991b1b',
        dot: '#ef4444',
      };
  }
};

export const getDarkEventStyle = (state: EventState): EventStyle => {
  switch (state) {
    case 'green':
      return {
        bg: '#064e3b',
        text: '#6ee7b7',
        border: '#10b981',
        pillBg: '#064e3b',
        pillText: '#6ee7b7',
        dot: '#10b981',
      };
    case 'yellow':
      return {
        bg: '#78350f',
        text: '#fde047',
        border: '#fbbf24',
        pillBg: '#78350f',
        pillText: '#fde047',
        dot: '#fbbf24',
      };
    case 'red':
      return {
        bg: '#7f1d1d',
        text: '#fca5a5',
        border: '#f87171',
        pillBg: '#7f1d1d',
        pillText: '#fca5a5',
        dot: '#f87171',
      };
  }
};

export const getEventStyle = (state: EventState, isDark: boolean): EventStyle => {
  return isDark ? getDarkEventStyle(state) : getLightEventStyle(state);
};
