import { useState } from 'react';
import type { ThemeConfig } from './types.ts';

interface ScheduleFormPanelProps {
  theme: ThemeConfig;
  onClose: () => void;
}

export function ScheduleFormPanel({ theme, onClose }: ScheduleFormPanelProps) {
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('20:00');
  const [dayOfWeek, setDayOfWeek] = useState('Tuesday');
  const [recurrenceType, setRecurrenceType] = useState<'forever' | 'until'>('forever');
  const [endDate, setEndDate] = useState('31/12/2026');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div
      className="w-80 rounded-lg p-6"
      style={{
        backgroundColor: theme.surface,
        border: `1px solid ${theme.border}`,
        boxShadow: theme.panelShadow,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold" style={{ color: theme.text }}>
          Create Schedule
        </h2>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded flex items-center justify-center hover:opacity-70 transition-opacity"
          style={{
            backgroundColor: theme.surfaceAlt,
            color: theme.textMuted,
          }}
        >
          ×
        </button>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Time Range Picker */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
            Time Range
          </label>
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="flex-1 px-3 py-2 rounded text-sm"
              style={{
                backgroundColor: theme.inputBg,
                color: theme.inputText,
                border: `1px solid ${theme.inputBorder}`,
              }}
            />
            <span style={{ color: theme.textMuted }}>-</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="flex-1 px-3 py-2 rounded text-sm"
              style={{
                backgroundColor: theme.inputBg,
                color: theme.inputText,
                border: `1px solid ${theme.inputBorder}`,
              }}
            />
          </div>
        </div>

        {/* Day of Week Selector */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
            Day of Week
          </label>
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(e.target.value)}
            className="w-full px-3 py-2 rounded text-sm"
            style={{
              backgroundColor: theme.inputBg,
              color: theme.inputText,
              border: `1px solid ${theme.inputBorder}`,
            }}
          >
            {daysOfWeek.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>

        {/* Recurrence Options */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
            Recurrence
          </label>
          <div className="space-y-2">
            {/* Option A: Repeat weekly forever */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="recurrence"
                checked={recurrenceType === 'forever'}
                onChange={() => setRecurrenceType('forever')}
                className="w-4 h-4"
                style={{ accentColor: theme.isDark ? '#60a5fa' : '#3b82f6' }}
              />
              <span className="text-sm" style={{ color: theme.text }}>
                Repeat weekly forever
              </span>
            </label>

            {/* Option B: Repeat until specific date */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="recurrence"
                checked={recurrenceType === 'until'}
                onChange={() => setRecurrenceType('until')}
                className="w-4 h-4 mt-0.5"
                style={{ accentColor: theme.isDark ? '#60a5fa' : '#3b82f6' }}
              />
              <div className="flex-1">
                <span className="text-sm block mb-2" style={{ color: theme.text }}>
                  Repeat until specific date
                </span>
                {recurrenceType === 'until' && (
                  <input
                    type="text"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="w-full px-3 py-2 rounded text-sm"
                    style={{
                      backgroundColor: theme.inputBg,
                      color: theme.inputText,
                      border: `1px solid ${theme.inputBorder}`,
                    }}
                  />
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded text-sm font-medium transition-opacity hover:opacity-80"
            style={{
              backgroundColor: theme.surfaceAlt,
              color: theme.text,
            }}
          >
            Cancel
          </button>
          <button
            className="flex-1 px-4 py-2 rounded text-sm font-medium transition-opacity hover:opacity-80"
            style={{
              backgroundColor: theme.isDark ? '#3b82f6' : '#2563eb',
              color: '#ffffff',
            }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
