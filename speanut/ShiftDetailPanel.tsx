import { useState } from 'react';
import { X, Trash2, Plus, AlertCircle } from 'lucide-react';
import type { AppTheme, Shift, ClassInfo, ShiftStatus, DayOfWeek } from './types';

interface ShiftDetailPanelProps {
  theme: AppTheme;
  selectedDate: string | null;
  shifts: Shift[];
  classes: ClassInfo[];
  onClose: () => void;
  onDeleteShift: (shiftId: string) => void;
  onAddShift: (classId: string, status: ShiftStatus, recurringDays?: DayOfWeek[]) => void;
  onAddClass: (name: string, abbreviation: string, rate: number) => void;
  onDeleteClass: (classId: string) => void;
  onMarkCancelled: (shiftId: string) => void;
}

export function ShiftDetailPanel({
  theme,
  selectedDate,
  shifts,
  classes,
  onClose,
  onDeleteShift,
  onAddShift,
  onAddClass,
  onDeleteClass,
  onMarkCancelled,
}: ShiftDetailPanelProps) {
  const [selectedClassId, setSelectedClassId] = useState('');
  const [shiftType, setShiftType] = useState<ShiftStatus>('fixed');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassAbbr, setNewClassAbbr] = useState('');
  const [newClassRate, setNewClassRate] = useState('25');
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [longPressClassId, setLongPressClassId] = useState<string | null>(null);

  if (!selectedDate) return null;

  const dayShifts = shifts.filter(s => s.date === selectedDate);
  const dateObj = new Date(selectedDate);
  const formattedDate = dateObj.toLocaleDateString('vi-VN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const toggleDay = (day: DayOfWeek) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleAddShift = () => {
    if (!selectedClassId) return;

    if (shiftType === 'extra') {
      onAddShift(selectedClassId, 'extra');
    } else {
      onAddShift(selectedClassId, 'fixed', selectedDays.length > 0 ? selectedDays : undefined);
    }

    setSelectedClassId('');
    setSelectedDays([]);
  };

  const handleAddClass = () => {
    if (!newClassName || !newClassAbbr || !newClassRate) return;
    onAddClass(newClassName, newClassAbbr, parseFloat(newClassRate));
    setNewClassName('');
    setNewClassAbbr('');
    setNewClassRate('25');
    setShowAddClassModal(false);
  };

  const handleLongPressStart = (classId: string) => {
    const timer = setTimeout(() => {
      setLongPressClassId(classId);
    }, 800);
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleConfirmDeleteClass = () => {
    if (longPressClassId) {
      onDeleteClass(longPressClassId);
      setLongPressClassId(null);
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: theme.modalOverlay }}
        onClick={onClose}
      />

      {/* Panel - Bottom sheet on mobile, centered modal on desktop */}
      <div
        className={`fixed z-50 rounded-t-2xl md:rounded-2xl ${
          isMobile ? 'bottom-0 left-0 right-0' : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg'
        }`}
        style={{
          backgroundColor: theme.modalBg,
          boxShadow: theme.cardShadow,
          fontFamily: 'Inter, sans-serif',
          maxHeight: isMobile ? '85vh' : '90vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: theme.border }}
        >
          <div>
            <h2 className="text-lg font-semibold" style={{ color: theme.text }}>
              Chi tiết ca dạy
            </h2>
            <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
              {formattedDate}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ backgroundColor: theme.surface }}
          >
            <X size={18} style={{ color: theme.text }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
          {/* Current shifts */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3" style={{ color: theme.text }}>
              Ca dạy hiện tại
            </h3>
            {dayShifts.length === 0 ? (
              <p className="text-sm" style={{ color: theme.textMuted }}>
                Chưa có ca dạy nào được lên lịch.
              </p>
            ) : (
              <div className="space-y-2">
                {dayShifts.map((shift) => {
                  const classInfo = classes.find(c => c.id === shift.classId);
                  const statusText = shift.status === 'fixed' ? 'Cố định' : shift.status === 'extra' ? 'Thêm giờ' : 'Đã hủy';

                  return (
                    <div
                      key={shift.id}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{
                        backgroundColor: theme.surface,
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium" style={{ color: theme.text }}>
                          {classInfo?.name || 'Không rõ'}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
                          {shift.hours}h · {statusText}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {shift.status === 'fixed' && (
                          <button
                            onClick={() => onMarkCancelled(shift.id)}
                            className="w-8 h-8 rounded flex items-center justify-center hover:opacity-70 transition-opacity"
                            style={{ backgroundColor: theme.pillYellow }}
                            title="Đổi sang ca bận"
                          >
                            <AlertCircle size={14} style={{ color: theme.pillYellowText }} />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteShift(shift.id)}
                          className="w-8 h-8 rounded flex items-center justify-center hover:opacity-70 transition-opacity"
                          style={{ backgroundColor: theme.pillRed }}
                          title="Xóa ca"
                        >
                          <Trash2 size={14} style={{ color: theme.pillRedText }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add new shift */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
                Thêm ca dạy mới
              </h3>
            </div>

            {/* Class selector with + button */}
            <div className="mb-3 relative">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                onMouseDown={(e) => {
                  const target = e.target as HTMLSelectElement;
                  const option = target.options[target.selectedIndex];
                  if (option && option.value) {
                    handleLongPressStart(option.value);
                  }
                }}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
                onTouchStart={(e) => {
                  const target = e.target as HTMLSelectElement;
                  const option = target.options[target.selectedIndex];
                  if (option && option.value) {
                    handleLongPressStart(option.value);
                  }
                }}
                onTouchEnd={handleLongPressEnd}
                className="w-full px-3 py-2 pr-10 rounded text-sm"
                style={{
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  border: `1px solid ${theme.inputBorder}`,
                }}
              >
                <option value="">Chọn lớp học...</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.abbreviation}) - {cls.rate.toLocaleString('vi-VN')}đ/h
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowAddClassModal(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center hover:opacity-70 transition-opacity"
                style={{ backgroundColor: theme.buttonPrimary }}
                title="Thêm lớp mới"
              >
                <Plus size={14} style={{ color: theme.buttonPrimaryText }} />
              </button>
            </div>

            {/* Shift type toggle */}
            <div className="mb-3">
              <div
                className="inline-flex rounded-lg p-1 w-full"
                style={{ backgroundColor: theme.surface }}
              >
                <button
                  onClick={() => setShiftType('fixed')}
                  className="flex-1 px-3 py-2 rounded text-sm font-medium transition-all"
                  style={{
                    backgroundColor: shiftType === 'fixed' ? theme.pillGreen : 'transparent',
                    color: shiftType === 'fixed' ? theme.pillGreenText : theme.text,
                  }}
                >
                  Ca cố định
                </button>
                <button
                  onClick={() => setShiftType('extra')}
                  className="flex-1 px-3 py-2 rounded text-sm font-medium transition-all"
                  style={{
                    backgroundColor: shiftType === 'extra' ? theme.pillYellow : 'transparent',
                    color: shiftType === 'extra' ? theme.pillYellowText : theme.text,
                  }}
                >
                  Ca thêm giờ
                </button>
              </div>
            </div>

            {/* Day of week selector (only for fixed shifts) */}
            {shiftType === 'fixed' && (
              <div className="mb-4">
                <p className="text-xs mb-2" style={{ color: theme.textMuted }}>
                  Lặp lại vào (tùy chọn):
                </p>
                <div className="flex gap-2">
                  {(['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const).map((day, idx) => {
                    const dayNum = (idx + 1) % 7 as DayOfWeek;
                    const isSelected = selectedDays.includes(dayNum);

                    return (
                      <button
                        key={idx}
                        onClick={() => toggleDay(dayNum)}
                        className="flex-1 h-10 rounded-lg text-xs font-medium transition-all"
                        style={{
                          backgroundColor: isSelected ? theme.buttonPrimary : theme.surface,
                          color: isSelected ? theme.buttonPrimaryText : theme.text,
                          border: `1px solid ${theme.border}`,
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add button */}
            <button
              onClick={handleAddShift}
              disabled={!selectedClassId}
              className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-40"
              style={{
                backgroundColor: theme.buttonPrimary,
                color: theme.buttonPrimaryText,
              }}
            >
              Thêm ca dạy
            </button>
          </div>
        </div>
      </div>

      {/* Add Class Modal */}
      {showAddClassModal && (
        <>
          <div
            className="fixed inset-0 z-50"
            style={{ backgroundColor: theme.modalOverlay }}
            onClick={() => setShowAddClassModal(false)}
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm rounded-2xl p-6"
            style={{
              backgroundColor: theme.modalBg,
              boxShadow: theme.cardShadow,
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: theme.text }}>
              Thêm lớp học mới
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="Tên lớp học"
                className="w-full px-3 py-2 rounded text-sm"
                style={{
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  border: `1px solid ${theme.inputBorder}`,
                }}
              />
              <input
                type="text"
                value={newClassAbbr}
                onChange={(e) => setNewClassAbbr(e.target.value)}
                placeholder="Viết tắt"
                className="w-full px-3 py-2 rounded text-sm"
                style={{
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  border: `1px solid ${theme.inputBorder}`,
                }}
              />
              <input
                type="number"
                value={newClassRate}
                onChange={(e) => setNewClassRate(e.target.value)}
                placeholder="Lương/giờ (đồng)"
                className="w-full px-3 py-2 rounded text-sm"
                style={{
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  border: `1px solid ${theme.inputBorder}`,
                }}
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowAddClassModal(false)}
                  className="flex-1 px-4 py-2 rounded text-sm font-medium"
                  style={{
                    backgroundColor: theme.buttonSecondary,
                    color: theme.buttonSecondaryText,
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddClass}
                  className="flex-1 px-4 py-2 rounded text-sm font-medium"
                  style={{
                    backgroundColor: theme.buttonPrimary,
                    color: theme.buttonPrimaryText,
                  }}
                >
                  Thêm
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Class Confirmation */}
      {longPressClassId && (
        <>
          <div
            className="fixed inset-0 z-50"
            style={{ backgroundColor: theme.modalOverlay }}
            onClick={() => setLongPressClassId(null)}
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm rounded-2xl p-6"
            style={{
              backgroundColor: theme.modalBg,
              boxShadow: theme.cardShadow,
            }}
          >
            <h3 className="text-lg font-semibold mb-2" style={{ color: theme.text }}>
              Xóa lớp học?
            </h3>
            <p className="text-sm mb-4" style={{ color: theme.textMuted }}>
              Bạn có chắc chắn muốn xóa lớp học này? Tất cả ca dạy liên quan sẽ bị xóa.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setLongPressClassId(null)}
                className="flex-1 px-4 py-2 rounded text-sm font-medium"
                style={{
                  backgroundColor: theme.buttonSecondary,
                  color: theme.buttonSecondaryText,
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDeleteClass}
                className="flex-1 px-4 py-2 rounded text-sm font-medium"
                style={{
                  backgroundColor: theme.pillRed,
                  color: theme.pillRedText,
                }}
              >
                Xóa
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
