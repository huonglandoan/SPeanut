import type { ClassInfo, Shift, SalaryMetrics } from './types';

export const mockClasses: ClassInfo[] = [
  { id: '1', name: 'Toán A1', abbreviation: 'T9', rate: 50000 },
  { id: '2', name: 'Lý Đại Cương', abbreviation: 'L12', rate: 60000 },
  { id: '3', name: 'Hóa Thực Hành', abbreviation: 'Lab5', rate: 45000 },
  { id: '4', name: 'Thảo Luận Nhóm', abbreviation: 'W3', rate: 55000 },
  { id: '5', name: 'Tiếng Anh B1', abbreviation: 'S7', rate: 52000 },
];

export const mockShifts: Shift[] = [
  // Week 1
  { id: '1', classId: '1', date: '2026-05-01', status: 'fixed', hours: 2 },
  { id: '2', classId: '2', date: '2026-05-02', status: 'fixed', hours: 3 },
  { id: '3', classId: '3', date: '2026-05-03', status: 'extra', hours: 2 },

  // Week 2
  { id: '4', classId: '1', date: '2026-05-08', status: 'fixed', hours: 2 },
  { id: '5', classId: '2', date: '2026-05-09', status: 'fixed', hours: 3 },
  { id: '6', classId: '4', date: '2026-05-10', status: 'extra', hours: 1.5 },

  // Week 3
  { id: '7', classId: '1', date: '2026-05-15', status: 'fixed', hours: 2 },
  { id: '8', classId: '2', date: '2026-05-16', status: 'cancelled', hours: 3 },
  { id: '9', classId: '3', date: '2026-05-17', status: 'fixed', hours: 2 },
  { id: '10', classId: '5', date: '2026-05-17', status: 'extra', hours: 2 },

  // Week 4
  { id: '11', classId: '1', date: '2026-05-22', status: 'fixed', hours: 2 },
  { id: '12', classId: '2', date: '2026-05-23', status: 'fixed', hours: 3 },
  { id: '13', classId: '3', date: '2026-05-24', status: 'fixed', hours: 2 },
  { id: '14', classId: '4', date: '2026-05-25', status: 'extra', hours: 2 },

  // Week 5
  { id: '15', classId: '1', date: '2026-05-29', status: 'fixed', hours: 2 },
  { id: '16', classId: '2', date: '2026-05-30', status: 'fixed', hours: 3 },
  { id: '17', classId: '5', date: '2026-05-31', status: 'extra', hours: 1.5 },
];

export const mockSalaryMetrics: SalaryMetrics = {
  totalPayout: 2450000,
  totalSessions: 17,
  extraBonus: 385000,
  completedSessions: 14,
  expectedSessions: 20,
  monthStatus: 'counting',
};
