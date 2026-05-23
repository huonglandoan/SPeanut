import type { ThemeConfig } from './types.ts';
import { getEventStyle } from './themeConfig';

interface StateLegendProps {
  theme: ThemeConfig;
}

export function StateLegend({ theme }: StateLegendProps) {
  const legendItems = [
    {
      state: 'green' as const,
      label: 'Fixed Regular Classes',
      description: 'Standard repeating weekly classes',
    },
    {
      state: 'yellow' as const,
      label: 'Overtime / Substitute',
      description: 'Ad-hoc, extra, or make-up classes',
    },
    {
      state: 'red' as const,
      label: 'Passed / Cancelled',
      description: 'Cancelled or passed to another tutor',
    },
  ];

  return (
    <div
      className="rounded-lg p-4"
      style={{
        backgroundColor: theme.surface,
        border: `1px solid ${theme.border}`,
        boxShadow: theme.cardShadow,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <h3 className="text-sm font-semibold mb-3" style={{ color: theme.text }}>
        State Legend
      </h3>

      <div className="space-y-3">
        {legendItems.map((item) => {
          const eventStyle = getEventStyle(item.state, theme.isDark);

          return (
            <div key={item.state} className="flex items-start gap-3">
              {/* Color indicator */}
              <div
                className="w-4 h-4 rounded mt-0.5 flex-shrink-0"
                style={{
                  backgroundColor: eventStyle.bg,
                  border: `2px solid ${eventStyle.border}`,
                }}
              />

              {/* Label and description */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: theme.text }}>
                  {item.label}
                </div>
                <div className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
                  {item.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
