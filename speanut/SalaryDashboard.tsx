import type { AppTheme, SalaryMetrics } from './types';

interface SalaryDashboardProps {
  theme: AppTheme;
  metrics: SalaryMetrics;
}

export function SalaryDashboard({ theme, metrics }: SalaryDashboardProps) {
  const progressPercentage = (metrics.completedSessions / metrics.expectedSessions) * 100;
  const greenPercentage = Math.min(progressPercentage, 100);
  const yellowPercentage = Math.max(0, progressPercentage - 100);

  const getStatusBadgeStyle = () => {
    switch (metrics.monthStatus) {
      case 'counting':
        return {
          bg: theme.badgeCounting,
          text: theme.badgeCountingText,
          label: 'Đang tính',
        };
      case 'locked':
        return {
          bg: theme.badgeLocked,
          text: theme.badgeLockedText,
          label: 'Đã khóa',
        };
      case 'paid':
        return {
          bg: theme.badgePaid,
          text: theme.badgePaidText,
          label: 'Đã trả',
        };
    }
  };

  const badgeStyle = getStatusBadgeStyle();

  return (
    <div
      className="rounded-lg p-4 md:p-6"
      style={{
        backgroundColor: theme.cardBg,
        boxShadow: theme.cardShadow,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Header with status badge */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-semibold" style={{ color: theme.text }}>
          Tổng quan lương
        </h2>
        <div
          className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide"
          style={{
            backgroundColor: badgeStyle.bg,
            color: badgeStyle.text,
          }}
        >
          {badgeStyle.label}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
        {/* Total Payout */}
        <div
          className="p-3 md:p-4 rounded-lg"
          style={{
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
          }}
        >
          <div className="text-xs font-medium mb-1" style={{ color: theme.textMuted }}>
            Tổng lương
          </div>
          <div className="text-2xl md:text-3xl font-bold" style={{ color: theme.buttonPrimary }}>
            {metrics.totalPayout.toLocaleString('vi-VN')}đ
          </div>
        </div>

        {/* Total Sessions */}
        <div
          className="p-3 md:p-4 rounded-lg"
          style={{
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
          }}
        >
          <div className="text-xs font-medium mb-1" style={{ color: theme.textMuted }}>
            Tổng số ca
          </div>
          <div className="text-2xl md:text-3xl font-bold" style={{ color: theme.text }}>
            {metrics.totalSessions}
          </div>
        </div>

        {/* Extra Bonus */}
        <div
          className="p-3 md:p-4 rounded-lg"
          style={{
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
          }}
        >
          <div className="text-xs font-medium mb-1" style={{ color: theme.textMuted }}>
            Thưởng thêm giờ
          </div>
          <div className="text-2xl md:text-3xl font-bold" style={{ color: theme.progressYellow }}>
            {metrics.extraBonus.toLocaleString('vi-VN')}đ
          </div>
        </div>
      </div>

      {/* Progress Bar Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
            Tiến độ tháng này
          </h3>
          <span className="text-xs font-medium" style={{ color: theme.textMuted }}>
            {metrics.completedSessions} / {metrics.expectedSessions} ca
          </span>
        </div>

        {/* Custom Progress Bar */}
        <div
          className="h-7 md:h-8 rounded-lg overflow-hidden relative"
          style={{ backgroundColor: theme.progressBg }}
        >
          {/* Green fill (completed sessions) */}
          <div
            className="absolute top-0 left-0 h-full transition-all duration-500"
            style={{
              width: `${greenPercentage}%`,
              backgroundColor: theme.progressGreen,
            }}
          />

          {/* Yellow fill (extra sessions beyond target) */}
          {yellowPercentage > 0 && (
            <div
              className="absolute top-0 h-full transition-all duration-500"
              style={{
                left: '100%',
                width: `${Math.min(yellowPercentage, 50)}%`,
                backgroundColor: theme.progressYellow,
              }}
            />
          )}

          {/* Progress text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold" style={{ color: theme.text }}>
              {progressPercentage.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Progress legend */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: theme.progressGreen }}
            />
            <span className="text-xs" style={{ color: theme.textMuted }}>
              Đã hoàn thành
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: theme.progressYellow }}
            />
            <span className="text-xs" style={{ color: theme.textMuted }}>
              Thêm giờ
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
