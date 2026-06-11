'use client'

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, User, Wallet, Calendar, BookOpen, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from '../styles/Admin.module.css';

interface AdminDashboardProps {
  onLogout: () => void;
}

const WEEKDAYS_LABELS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

export default function AdminDashboardView({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'classes' | 'teachers' | 'payroll'>('payroll');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);

  const [users, setUsers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [hiddenUserIds, setHiddenUserIds] = useState<string[]>([]);
  const [hiddenClassKeys, setHiddenClassKeys] = useState<string[]>([]);

  // Load hidden list and sync company name title from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUsers = localStorage.getItem('speanut_admin_hidden_users');
      const savedClasses = localStorage.getItem('speanut_admin_hidden_classes');
      if (savedUsers) setHiddenUserIds(JSON.parse(savedUsers));
      if (savedClasses) setHiddenClassKeys(JSON.parse(savedClasses));

      const customName = localStorage.getItem('speanut_config_company_name');
      if (customName) {
        document.title = `${customName} - Admin Dashboard`;
      }
    }
  }, []);

  // Load Admin Data from custom API endpoint
  useEffect(() => {
    async function fetchAdminData() {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/dashboard');
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Không thể tải dữ liệu admin.');
        }

        const filteredUsers = (data.users || []).filter((u: any) => 
          u.email !== 'admin@speanut.com' && u.email !== '111111@speanut.com'
        );
        setUsers(filteredUsers);
        setClasses(data.classes || []);
        setSchedules(data.class_schedules || []);
        setError(null);

        // Load hidden list from localStorage to verify default selection
        let localHiddenUsers: string[] = [];
        if (typeof window !== 'undefined') {
          const savedUsers = localStorage.getItem('speanut_admin_hidden_users');
          if (savedUsers) {
            localHiddenUsers = JSON.parse(savedUsers);
          }
        }

        const visibleOnes = filteredUsers.filter((u: any) => !localHiddenUsers.includes(u.id));
        if (visibleOnes.length > 0) {
          setSelectedUserId(visibleOnes[0].id);
        } else if (filteredUsers.length > 0) {
          setSelectedUserId(filteredUsers[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Lỗi hệ thống khi tải dữ liệu.');
      } finally {
        setLoading(false);
      }
    }

    fetchAdminData();
  }, []);

  const handleHideTeacher = (userId: string, userName: string) => {
    const isConfirmed = window.confirm(`Bạn có chắc chắn muốn ẩn giáo viên "${userName}" khỏi danh sách hiển thị không? \n(Dữ liệu gốc trên database vẫn được giữ nguyên)`);
    if (!isConfirmed) return;

    const updated = [...hiddenUserIds, userId];
    setHiddenUserIds(updated);
    localStorage.setItem('speanut_admin_hidden_users', JSON.stringify(updated));

    // Deselect if active
    if (selectedUserId === userId) {
      const visibleOnes = users.filter(u => u.id !== userId && !updated.includes(u.id));
      setSelectedUserId(visibleOnes.length > 0 ? visibleOnes[0].id : null);
    }
  };

  const handleHideClass = (classKey: string, className: string) => {
    const isConfirmed = window.confirm(`Bạn có chắc chắn muốn ẩn lớp "${className}" khỏi danh sách hiển thị không? \n(Dữ liệu gốc trên database vẫn được giữ nguyên)`);
    if (!isConfirmed) return;

    const updated = [...hiddenClassKeys, classKey];
    setHiddenClassKeys(updated);
    localStorage.setItem('speanut_admin_hidden_classes', JSON.stringify(updated));
  };

  const handleResetHidden = () => {
    if (window.confirm("Bạn có muốn hiển thị lại toàn bộ giáo viên và lớp học đã ẩn không?")) {
      setHiddenUserIds([]);
      setHiddenClassKeys([]);
      localStorage.removeItem('speanut_admin_hidden_users');
      localStorage.removeItem('speanut_admin_hidden_classes');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(y => y - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(y => y + 1);
    } else {
      setMonth(month + 1);
    }
  };

  // Helper calculating payroll metrics and daily schedules for a user
  const calculateUserStats = (uId: string, targetYear: number, targetMonth: number) => {
    let fixedCount = 0;
    let extraCount = 0;
    let totalSalary = 0;

    const userClasses = classes.filter(c => c.user_id === uId);
    const userClassIds = userClasses.map(c => c.id);
    const userSchedules = schedules.filter(s => userClassIds.includes(s.class_id));

    const classBreakdownMap: Record<string, {
      classId: number;
      name: string;
      color: string;
      rate: number;
      activeSessions: number;
      earnings: number;
    }> = {};

    const sessionLog: Array<{
      id: string;
      className: string;
      dateDisplay: string;
      dayOfWeekLabel: string;
      time: string;
      rate: number;
    }> = [];

    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const cellDateStr = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dateObj = new Date(targetYear, targetMonth - 1, d);
      const dow = dateObj.getDay();

      const activeScheds = userSchedules.filter((s: any) => 
        s.day_of_week === dow &&
        s.valid_from <= cellDateStr &&
        (s.valid_to === null || cellDateStr <= s.valid_to)
      );

      activeScheds.forEach((s: any) => {
        const cls = userClasses.find(c => c.id === s.class_id);
        if (!cls) return;

        const classKey = (cls.short_name || '').trim().toUpperCase() || cls.name.trim();

        if (!classBreakdownMap[classKey]) {
          classBreakdownMap[classKey] = {
            classId: s.class_id,
            name: cls.name,
            color: cls.type === 'FIXED' ? '#00B383' : '#FFB000',
            rate: cls.rate_per_session,
            activeSessions: 0,
            earnings: 0
          };
        }

        sessionLog.push({
          id: `${s.id}_${cellDateStr}`,
          className: cls.name,
          dateDisplay: `${String(d).padStart(2, "0")}/${String(targetMonth).padStart(2, "0")}`,
          dayOfWeekLabel: WEEKDAYS_LABELS[dow],
          time: `${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)}`,
          rate: cls.rate_per_session
        });

        if (cls.type === 'FIXED') {
          fixedCount += 1;
        } else {
          extraCount += 1;
        }
        totalSalary += cls.rate_per_session;
        classBreakdownMap[classKey].activeSessions += 1;
        classBreakdownMap[classKey].earnings += cls.rate_per_session;
      });
    }

    sessionLog.sort((a, b) => a.id.localeCompare(b.id));

    // Deduplicate class count to typical/distinct classes (excluding EXTRA classes)
    const uniqueShortNames = new Set(
      userClasses
        .filter(c => c.type !== 'EXTRA')
        .map(c => (c.short_name || '').trim().toUpperCase() || c.name.trim())
    );
    const classesCount = uniqueShortNames.size;

    return {
      fixedCount,
      extraCount,
      totalActive: fixedCount + extraCount,
      totalSalary,
      classSummaries: Object.values(classBreakdownMap).sort((a, b) => b.earnings - a.earnings),
      sessionLog,
      classesCount
    };
  };

  // Group all classes in the system to only show representative / typical classes (excluding EXTRA classes)
  const typicalClasses = useMemo(() => {
    // 1. For each class, compute its typical schedules and signature
    const classSchedulesMap: Record<number, { typicalScheds: any[]; signature: string }> = {};

    classes.forEach(c => {
      // Find all schedules belonging to this class ID
      const classScheds = schedules.filter(s => s.class_id === c.id);

      // Deduplicate schedules by: day_of_week, start_time, end_time
      const uniqueSchedsMap: Record<string, any> = {};
      classScheds.forEach(s => {
        const schedKey = `${s.day_of_week}_${s.start_time.slice(0, 5)}_${s.end_time.slice(0, 5)}`;
        if (!uniqueSchedsMap[schedKey]) {
          uniqueSchedsMap[schedKey] = {
            ...s,
            key: schedKey
          };
        }
      });

      // Sort unique schedules
      const sortedScheds = Object.values(uniqueSchedsMap).sort((a: any, b: any) => {
        const valA = a.day_of_week === 0 ? 7 : a.day_of_week;
        const valB = b.day_of_week === 0 ? 7 : b.day_of_week;
        return valA - valB;
      });

      // Create signature
      const signature = sortedScheds.map((s: any) => `${s.day_of_week}_${s.start_time.slice(0, 5)}_${s.end_time.slice(0, 5)}`).join('|');

      classSchedulesMap[c.id] = {
        typicalScheds: sortedScheds,
        signature
      };
    });

    // 2. Group classes by normalized code + signature across teachers
    const groupedMap: Record<string, {
      cls: any;
      teacherIds: string[];
      typicalSchedules: any[];
    }> = {};

    classes
      .filter(cls => cls.type !== 'EXTRA')
      .forEach(cls => {
        const classCode = (cls.short_name || '').trim().toUpperCase() || cls.name.trim();
        const { typicalScheds, signature } = classSchedulesMap[cls.id] || { typicalScheds: [], signature: '' };
        
        // Grouping key: classCode + signature
        const groupKey = `${classCode}#${signature}`;

        if (!groupedMap[groupKey]) {
          groupedMap[groupKey] = {
            cls: cls,
            teacherIds: [cls.user_id],
            typicalSchedules: typicalScheds
          };
        } else {
          // If already exists, we can keep the one with the higher ID as representative
          if (cls.id > groupedMap[groupKey].cls.id) {
            groupedMap[groupKey].cls = cls;
          }
          // Collect unique teacher IDs
          if (!groupedMap[groupKey].teacherIds.includes(cls.user_id)) {
            groupedMap[groupKey].teacherIds.push(cls.user_id);
          }
        }
      });

    // 3. Return the grouped typical classes
    return Object.values(groupedMap).map(item => {
      const classKey = `${item.cls.user_id}_${(item.cls.short_name || '').trim().toUpperCase() || item.cls.name.trim()}`;
      return {
        ...item.cls,
        classKey,
        teacherIds: item.teacherIds,
        typicalSchedules: item.typicalSchedules
      };
    })
    .filter(c => !hiddenClassKeys.includes(c.classKey) && !hiddenUserIds.includes(c.user_id))
    .sort((a, b) => b.id - a.id);
  }, [classes, schedules, hiddenClassKeys, hiddenUserIds]);

  // Filter typical classes for the selected teacher
  const teacherTypicalClasses = useMemo(() => {
    if (!selectedUserId) return [];
    return typicalClasses.filter(c => (c.teacherIds || [c.user_id]).includes(selectedUserId));
  }, [typicalClasses, selectedUserId]);

  const visibleUsers = useMemo(() => {
    return users.filter(u => !hiddenUserIds.includes(u.id));
  }, [users, hiddenUserIds]);

  // Compile estimated monthly thù lao summary for sidebar / payroll table
  const userSalaries = useMemo(() => {
    const map: Record<string, { 
      totalSalary: number; 
      totalExtra: number; 
      totalEarnings: number; 
      totalActive: number; 
      classesCount: number 
    }> = {};

    visibleUsers.forEach(u => {
      const stats = calculateUserStats(u.id, year, month);
      
      let totalExtra = 0;
      if (u.extra_incomes && typeof u.extra_incomes === 'object') {
        const dbKey = `${year}_${month}`;
        const extraList = u.extra_incomes[dbKey];
        if (Array.isArray(extraList)) {
          totalExtra = extraList.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
        }
      }

      map[u.id] = {
        totalSalary: stats.totalSalary,
        totalExtra: totalExtra,
        totalEarnings: stats.totalSalary + totalExtra,
        totalActive: stats.totalActive,
        classesCount: stats.classesCount
      };
    });
    return map;
  }, [visibleUsers, year, month, classes, schedules]);

  // Selected Teacher for the Profile view
  const selectedUser = useMemo(() => {
    return visibleUsers.find(u => u.id === selectedUserId) || null;
  }, [visibleUsers, selectedUserId]);

  const selectedUserStats = useMemo(() => {
    if (!selectedUserId) return null;
    return calculateUserStats(selectedUserId, year, month);
  }, [selectedUserId, year, month, classes, schedules]);

  // EXCEL / CSV Exporter for monthly payroll list
  const exportAllPayrollsToCSV = () => {
    const removeAccents = (str: string): string => {
      if (!str) return "";
      return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D");
    };

    const headers = ["Ho ten", "Buoi day", "Luong", "Them", "STK"];
    
    const rows = visibleUsers.map((u) => {
      const stats = userSalaries[u.id] || { totalSalary: 0, totalExtra: 0, totalActive: 0 };
      const bankInfo = u.bank_number || '';
      return [
        `"${removeAccents(u.full_name || 'Chua dat ten').replace(/"/g, '""')}"`,
        stats.totalActive,
        stats.totalSalary,
        stats.totalExtra,
        `"${bankInfo}"`
      ];
    });

    const csvContent = [
      "sep=,",
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bang_luong_tong_hop_thang_${month}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const MONTHS = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  return (
    <div className={styles.adminWrapper}>
      {/* Admin Header */}
      <header className={styles.adminHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.adminTitle}>Quản lý Giảng viên</h1>
          <p className={styles.adminSubtitle}>Theo dõi hệ thống và lớp học, giáo viên và lương hàng tháng</p>
        </div>
        <div className={styles.headerRight}>
          {(hiddenUserIds.length > 0 || hiddenClassKeys.length > 0) && (
            <button 
              onClick={handleResetHidden} 
              className={styles.adminLogoutBtn} 
              style={{ color: 'var(--primary, #735BF2)', borderColor: 'rgba(115, 91, 242, 0.2)', marginRight: '8px' }}
            >
              Hiện lại đã ẩn ({hiddenUserIds.length + hiddenClassKeys.length})
            </button>
          )}
          <div className={styles.monthSelectRow}>
            <button style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--foreground)' }} onClick={prevMonth} aria-label="Previous month">
              <ChevronLeft size={18} />
            </button>
            <span className={styles.monthLabel}>{MONTHS[month - 1]} / {year}</span>
            <button style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--foreground)' }} onClick={nextMonth} aria-label="Next month">
              <ChevronRight size={18} />
            </button>
          </div>
          <button 
            onClick={() => { window.location.href = '/deploy'; }} 
            className={styles.adminLogoutBtn}
            style={{ marginRight: '8px', color: '#00b383', borderColor: 'rgba(0, 179, 131, 0.2)' }}
          >
            Cấu hình Deploy
          </button>
          <button onClick={handleLogout} className={styles.adminLogoutBtn}>
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className={styles.tabContainer} aria-label="Tab navigation">
        <button 
          className={`${styles.tabBtn} ${activeTab === 'payroll' ? styles.tabBtnActive : ''}`} 
          onClick={() => setActiveTab('payroll')}
        >
          <Wallet size={16} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle' }} />
          Bảng lương theo tháng
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'teachers' ? styles.tabBtnActive : ''}`} 
          onClick={() => setActiveTab('teachers')}
        >
          <User size={16} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle' }} />
          Giáo viên
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'classes' ? styles.tabBtnActive : ''}`} 
          onClick={() => setActiveTab('classes')}
        >
          <BookOpen size={16} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle' }} />
          Danh sách lớp hiện có
        </button>
      </nav>

      {error ? (
        <div className={styles.emptyState} style={{ borderColor: 'var(--red, #ff3b30)', color: 'var(--red, #ff3b30)' }}>
          <p className={styles.emptyText}>{error}</p>
        </div>
      ) : loading ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>Đang tải dữ liệu quản trị...</p>
        </div>
      ) : (
        <main>
          {/* TAB 1: PAYROLL */}
          {activeTab === 'payroll' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className={styles.payrollHeaderRow}>
                <h2 className={styles.sectionTitle}>Tổng hợp thù lao {MONTHS[month - 1]} / {year}</h2>
                <button type="button" onClick={exportAllPayrollsToCSV} className={styles.exportAllBtn}>
                  <Download size={16} />
                  Tải xuống Excel (CSV)
                </button>
              </div>

              <div className={styles.payrollTableWrapper}>
                <table className={styles.payrollTable}>
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Giáo viên</th>
                      <th>Số buổi dạy</th>
                      <th>Lương</th>
                      <th>Ngân hàng liên kết</th>
                      <th>Thông tin chuyển khoản</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleUsers.length > 0 ? (
                      visibleUsers.map((u, index) => {
                        const stats = userSalaries[u.id] || { totalSalary: 0, totalExtra: 0, totalEarnings: 0, totalActive: 0 };
                        return (
                          <tr key={u.id}>
                            <td style={{ fontWeight: '600', width: '50px' }}>{index + 1}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img 
                                  src={u.avatar || '/avatar.png'} 
                                  onError={(e) => { (e.target as HTMLImageElement).src = '/avatar.png'; }}
                                  className={styles.userAvatar} 
                                  style={{ width: '32px', height: '32px' }}
                                  alt={u.full_name} 
                                />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontWeight: '600' }}>{u.full_name || 'Chưa đặt tên'}</span>
                                  <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>{u.email}</span>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontWeight: '600' }}>{stats.totalActive} buổi</td>
                            <td style={{ fontWeight: '700', color: 'var(--primary, #735BF2)' }}>
                              {stats.totalSalary.toLocaleString()}đ
                            </td>
                            <td>
                              {u.qr_code ? (
                                <div className={styles.payrollQrCol}>
                                  <img 
                                    src={u.qr_code} 
                                    className={styles.payrollQrThumbnail} 
                                    alt="VietQR code"
                                    onClick={() => window.open(u.qr_code, '_blank')}
                                    title="Click để xem ảnh to"
                                  />
                                  <div className={styles.payrollBankInfo}>
                                    <span className={styles.payrollBankBrand}>{u.bank_brand || 'N/A'}</span>
                                    <span className={styles.payrollBankMeta}>{u.bank_number || 'N/A'}</span>
                                  </div>
                                </div>
                              ) : (
                                <span style={{ fontStyle: 'italic', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                                  Chưa quét QR ngân hàng
                                </span>
                              )}
                            </td>
                            <td style={{ fontSize: '12px' }}>
                              {u.bank_brand ? (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontWeight: '500' }}>{u.bank_owner}</span>
                                  <span style={{ color: 'var(--muted-foreground)', fontSize: '11px' }}>
                                    STK: {u.bank_number} ({u.bank_brand})
                                  </span>
                                </div>
                              ) : (
                                <span style={{ fontStyle: 'italic', color: 'var(--muted-foreground)' }}>Chưa liên kết</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>
                          Không có giáo viên nào trong hệ thống.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: TEACHERS */}
          {activeTab === 'teachers' && (
            <div className={styles.adminContent}>
              {/* Left panel: List of users */}
              <aside className={styles.usersCard}>
                <h2 className={styles.sectionTitle}>Giáo viên ({visibleUsers.length})</h2>
                <div className={styles.userList}>
                  {visibleUsers.map(u => {
                    const isActive = u.id === selectedUserId;
                    const stats = userSalaries[u.id] || { totalSalary: 0, classesCount: 0 };
                    return (
                      <article
                        key={u.id}
                        className={`${styles.userItem} ${isActive ? styles.userItemActive : ''}`}
                        onClick={() => setSelectedUserId(u.id)}
                      >
                        <img 
                          src={u.avatar || '/avatar.png'} 
                          onError={(e) => { (e.target as HTMLImageElement).src = '/avatar.png'; }}
                          className={styles.userAvatar} 
                          alt={u.full_name} 
                        />
                        <div className={styles.userMeta}>
                          <span className={styles.userName}>{u.full_name || 'Chưa đặt tên'}</span>
                          <span className={styles.userEmail}>{u.email}</span>
                          <span className={styles.userStatsText}>
                            {stats.classesCount} lớp • Lương: {stats.totalSalary.toLocaleString()}đ
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </aside>

              {/* Right panel: User Details */}
              <main>
                {selectedUser ? (
                  <div className={styles.detailCard}>
                    {/* Profile Section */}
                    <section className={styles.profileSection}>
                      <img 
                        src={selectedUser.avatar || '/avatar.png'} 
                        onError={(e) => { (e.target as HTMLImageElement).src = '/avatar.png'; }}
                        className={styles.userAvatar} 
                        style={{ width: '80px', height: '80px' }} 
                        alt={selectedUser.full_name}
                      />
                      <div className={styles.profileInfo}>
                        <h2 className={styles.adminTitle} style={{ fontSize: '20px' }}>
                          {selectedUser.full_name || 'Chưa cập nhật tên'}
                        </h2>
                        <p className={styles.adminSubtitle}>{selectedUser.email}</p>
                        
                        <div className={styles.infoGrid}>
                          <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Ngân hàng</span>
                            <span className={styles.infoValue}>{selectedUser.bank_brand || 'Chưa liên kết'}</span>
                          </div>
                          <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Số tài khoản</span>
                            <span className={styles.infoValue}>{selectedUser.bank_number || 'Chưa liên kết'}</span>
                          </div>
                          <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Chủ tài khoản</span>
                            <span className={styles.infoValue}>{selectedUser.bank_owner || 'Chưa liên kết'}</span>
                          </div>
                        </div>
                      </div>
                      {selectedUser.qr_code && (
                        <img 
                          src={selectedUser.qr_code} 
                          className={styles.qrThumbnail} 
                          alt="VietQR code"
                          onClick={() => window.open(selectedUser.qr_code, '_blank')}
                          title="Click để phóng to mã QR"
                        />
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button 
                          onClick={() => handleHideTeacher(selectedUser.id, selectedUser.full_name || 'Chưa đặt tên')}
                          className={styles.adminDeleteBtn}
                          title="Ẩn giáo viên này khỏi danh sách hiển thị"
                        >
                          Ẩn giáo viên
                        </button>
                      </div>
                    </section>

                    {/* Các khoản thưởng / ghi chú tháng hiện tại */}
                    {(() => {
                      const dbKey = `${year}_${month}`;
                      const extraList = (selectedUser.extra_incomes && typeof selectedUser.extra_incomes === 'object')
                        ? selectedUser.extra_incomes[dbKey]
                        : null;
                      
                      const list = Array.isArray(extraList) ? extraList : [];
                      
                      return (
                        <section style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', marginTop: '8px' }}>
                          <h3 className={styles.sectionTitle} style={{ marginBottom: '16px' }}>Các khoản thưởng ({list.length})</h3>
                          {list.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                              {list.map((item: any) => (
                                <div key={item.id} style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center',
                                  padding: '12px 16px',
                                  borderRadius: '12px',
                                  border: '1px solid var(--border)',
                                  backgroundColor: 'rgba(115, 91, 242, 0.02)'
                                }}>
                                  <span style={{ fontWeight: '500', fontSize: '14px' }}>{item.name}</span>
                                  <span style={{ fontWeight: '700', color: '#00B383', fontSize: '14px' }}>+{item.amount.toLocaleString()}đ</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className={styles.adminSubtitle} style={{ fontStyle: 'italic', marginBottom: '24px' }}>
                              Không có khoản thưởng nào trong tháng này.
                            </p>
                          )}
                        </section>
                      );
                    })()}

                    {/* List of teaching classes */}
                    <section style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', marginTop: '8px' }}>
                      <h3 className={styles.sectionTitle} style={{ marginBottom: '16px' }}>Các lớp đang dạy ({teacherTypicalClasses.length})</h3>
                      <div className={styles.classesGrid}>
                        {teacherTypicalClasses.length > 0 ? (
                          teacherTypicalClasses.map((cls) => {
                            const classScheds = cls.typicalSchedules || [];
                            const teacherIds = cls.teacherIds || [cls.user_id];
                            const teachers = teacherIds
                              .map((tId: string) => users.find(u => u.id === tId))
                              .filter(Boolean);
                            const teachersNames = teachers.map((t: any) => t.full_name || 'N/A').join(', ');
                            const teachersEmails = teachers.map((t: any) => t.email || '').join('\n');

                            return (
                              <article key={cls.id} className={styles.adminClassCard} style={{ margin: 0 }}>
                                <div className={styles.classCardHeader}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontWeight: '600' }}>
                                      MÃ LỚP: {cls.short_name}
                                    </span>
                                    <h3 className={styles.className} style={{ fontSize: '16px' }}>{cls.name}</h3>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className={styles.teacherBadge} title={teachersEmails}>
                                      GV: {teachersNames}
                                    </span>
                                    <button 
                                      onClick={() => handleHideClass(cls.classKey, cls.name)}
                                      className={styles.classDeleteBtn}
                                      title="Ẩn lớp học này khỏi danh sách hiển thị"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                                  <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Thù lao / buổi</span>
                                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary, #735BF2)' }}>
                                    {cls.rate_per_session.toLocaleString()}đ
                                  </span>
                                </div>

                                <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '10px', marginTop: '10px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted-foreground)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                                    Khung giờ dạy
                                  </span>
                                  {classScheds.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      {classScheds.map((s: any) => (
                                        <div key={s.key || s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                          <span style={{ fontWeight: '500' }}>{WEEKDAYS_LABELS[s.day_of_week]}</span>
                                          <span>{s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span style={{ fontStyle: 'italic', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                                      Chưa thiết lập lịch dạy
                                    </span>
                                  )}
                                </div>
                              </article>
                            );
                          })
                        ) : (
                          <p className={styles.adminSubtitle} style={{ fontStyle: 'italic', gridColumn: '1/-1' }}>
                            Giáo viên này chưa phụ trách lớp học nào.
                          </p>
                        )}
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <p className={styles.emptyText}>Chọn một giáo viên từ danh sách bên trái để xem thông tin chi tiết</p>
                  </div>
                )}
              </main>
            </div>
          )}

          {/* TAB 3: CLASSES */}
          {activeTab === 'classes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 className={styles.sectionTitle}>Tất cả lớp học trong hệ thống ({typicalClasses.length})</h2>
              
              <div className={styles.classesGrid}>
                {typicalClasses.length > 0 ? (
                  typicalClasses.map(cls => {
                    const teacherIds = cls.teacherIds || [cls.user_id];
                    const teachers = teacherIds
                      .map((tId: string) => users.find(u => u.id === tId))
                      .filter(Boolean);
                    const teachersNames = teachers.map((t: any) => t.full_name || 'N/A').join(', ');
                    const teachersEmails = teachers.map((t: any) => t.email || '').join('\n');
                    const classScheds = cls.typicalSchedules || [];
                    
                    return (
                      <article key={cls.id} className={styles.adminClassCard}>
                        <div className={styles.classCardHeader}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontWeight: '600' }}>
                              MÃ LỚP: {cls.short_name}
                            </span>
                            <h3 className={styles.className} style={{ fontSize: '16px' }}>{cls.name}</h3>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={styles.teacherBadge} title={teachersEmails}>
                              GV: {teachersNames}
                            </span>
                            <button 
                              onClick={() => handleHideClass(cls.classKey, cls.name)}
                              className={styles.classDeleteBtn}
                              title="Ẩn lớp học này khỏi danh sách hiển thị"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Loại lớp</span>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: cls.type === 'FIXED' ? '#00B383' : '#FFB000' }}>
                            {cls.type === 'FIXED' ? 'Cố định' : 'Extra / Linh hoạt'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Thù lao / buổi</span>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary, #735BF2)' }}>
                            {cls.rate_per_session.toLocaleString()}đ
                          </span>
                        </div>

                        <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '10px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted-foreground)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                            Lịch dạy cụ thể
                          </span>
                          {classScheds.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {classScheds.map((s: any) => (
                                <div key={s.key || s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                  <span style={{ fontWeight: '500' }}>{WEEKDAYS_LABELS[s.day_of_week]}</span>
                                  <span>{s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontStyle: 'italic', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                              Chưa thiết lập lịch dạy
                            </span>
                          )}
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className={styles.emptyState} style={{ gridColumn: '1/-1' }}>
                    <p className={styles.emptyText}>Chưa có lớp học nào được tạo trong hệ thống.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
