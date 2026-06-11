// app/(dashboard)/salary.tsx
'use client'

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Wallet, Calendar, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from '../styles/Salary.module.css';
import { fetchProfile, updateProfile } from '../services/profile';
import { SkeletonCard } from '../components/Loader';

interface SalaryViewProps {
  activeNav: number;
  year: number;
  setYear: React.Dispatch<React.SetStateAction<number>>;
  month: number;
  setMonth: React.Dispatch<React.SetStateAction<number>>;
}

const MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];

export default function SalaryView({ activeNav, year, setYear, month, setMonth }: SalaryViewProps) {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelledSessions, setCancelledSessions] = useState<Record<string, boolean>>({});

  // Extra collection states
  const [extraIncomes, setExtraIncomes] = useState<Array<{ id: string; name: string; amount: number; status?: string; rejectReason?: string }>>([]);
  const [extraName, setExtraName] = useState('');
  const [extraAmount, setExtraAmount] = useState('');

  // Profile state for database sync
  const [profile, setProfile] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Load profile when Wallet tab is selected
  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await fetchProfile();
        setProfile(data);

        // Tải nhật ký thay đổi của riêng gia sư trong vòng 14 ngày gần nhất
        if (data && data.id) {
          const fourteenDaysAgo = new Date();
          fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

          const { data: logs, error: logsError } = await supabase
            .from('admin_audit_logs')
            .select('*')
            .eq('target_user_id', data.id)
            .gte('created_at', fourteenDaysAgo.toISOString())
            .order('created_at', { ascending: false });
            
          if (logsError) {
            console.error("Lỗi khi tải nhật ký hoạt động của gia sư:", logsError);
          } else {
            setAuditLogs(logs || []);
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải thông tin cá nhân:", err);
      }
    }
    if (activeNav === 2) {
      loadProfile();
    }
  }, [activeNav]);

  const syncExtraIncomesToDB = async (list: any[], targetYear: number, targetMonth: number, currentProfile: any) => {
    if (!currentProfile) return;
    try {
      const dbKey = `${targetYear}_${targetMonth}`;
      const updatedExtraIncomes = {
        ...(currentProfile.extra_incomes || {}),
        [dbKey]: list
      };
      const updatedProfile = await updateProfile({
        extra_incomes: updatedExtraIncomes
      });
      setProfile(updatedProfile);
    } catch (err) {
      console.error("Lỗi khi đồng bộ extra incomes lên DB:", err);
    }
  };

  // 1. Fetch dữ liệu lịch dạy từ API khi tab Wallet được chọn
  useEffect(() => {
    let active = true;
    async function fetchCalendarData() {
      try {
        setLoading(true);
        const res = await fetch('/api/calendar');
        if (!res.ok) throw new Error("Lỗi khi tải lịch học");
        const data = await res.json();
        if (active) {
          setSchedules(data);
          setError(null);
        }
      } catch (err: any) {
        if (active) setError(err.message || "Không thể tải dữ liệu.");
      } finally {
        if (active) setLoading(false);
      }
    }

    if (activeNav === 2) {
      fetchCalendarData();
    }

    return () => {
      active = false;
    };
  }, [activeNav]);

  // 2. Đồng bộ trạng thái buổi nghỉ và các khoản thu thêm từ localStorage/DB bất cứ khi nào tab Wallet được mở hoặc chuyển tháng
  useEffect(() => {
    if (activeNav === 2) {
      // Ưu tiên tải cancelled_sessions từ profile DB, fallback sang localStorage
      if (profile && profile.cancelled_sessions && typeof profile.cancelled_sessions === 'object') {
        setCancelledSessions(profile.cancelled_sessions);
        localStorage.setItem('speanut_cancelled_sessions', JSON.stringify(profile.cancelled_sessions));
      } else {
        const stored = localStorage.getItem('speanut_cancelled_sessions');
        if (stored) {
          try {
            setCancelledSessions(JSON.parse(stored));
          } catch (e) {
            console.error("Lỗi parse dữ liệu buổi nghỉ:", e);
          }
        } else {
          setCancelledSessions({});
        }
      }

      const key = `speanut_extra_incomes_${year}_${month}`;
      const dbKey = `${year}_${month}`;

      // 1. Kiểm tra nếu profile đã load và có thông tin tháng này
      if (profile) {
        const dbExtra = profile.extra_incomes?.[dbKey];
        if (Array.isArray(dbExtra)) {
          setExtraIncomes(dbExtra);
          localStorage.setItem(key, JSON.stringify(dbExtra));
          return;
        }
      }

      // 2. Nếu chưa load hoặc không có dữ liệu trên DB, fallback kiểm tra localStorage
      const storedExtra = localStorage.getItem(key);
      if (storedExtra) {
        try {
          const parsed = JSON.parse(storedExtra);
          setExtraIncomes(parsed);
          // Đồng bộ ngược lên DB nếu profile đã tải nhưng chưa có dữ liệu tháng này trên DB
          if (profile && (!profile.extra_incomes || !profile.extra_incomes[dbKey])) {
            syncExtraIncomesToDB(parsed, year, month, profile);
          }
        } catch (e) {
          console.error("Lỗi parse dữ liệu thu thêm từ localStorage:", e);
          setExtraIncomes([]);
        }
      } else {
        setExtraIncomes([]);
      }
    }
  }, [activeNav, year, month, profile]);

  const handleAddExtraIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraName.trim() || !extraAmount) return;
    const newItem = {
      id: Date.now().toString(),
      name: extraName.trim(),
      amount: parseInt(extraAmount)
    };
    const updated = [...extraIncomes, newItem];
    setExtraIncomes(updated);
    
    const key = `speanut_extra_incomes_${year}_${month}`;
    localStorage.setItem(key, JSON.stringify(updated));
    setExtraName('');
    setExtraAmount('');

    if (profile) {
      await syncExtraIncomesToDB(updated, year, month, profile);
    }
  };

  const handleDeleteExtraIncome = async (id: string) => {
    const updated = extraIncomes.filter(item => item.id !== id);
    setExtraIncomes(updated);
    
    const key = `speanut_extra_incomes_${year}_${month}`;
    localStorage.setItem(key, JSON.stringify(updated));

    if (profile) {
      await syncExtraIncomesToDB(updated, year, month, profile);
    }
  };

  // 3. Hàm chuyển đổi tháng xem bảng lương
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

  // 4. Tổng hợp thống kê chi tiết của tháng được chọn
  const stats = useMemo(() => {
    let fixedCount = 0;
    let extraCount = 0;
    let cancelledCount = 0;
    let totalSalary = 0;

    // Phân nhóm thu nhập theo từng lớp học
    const classBreakdownMap: Record<number, {
      classId: number;
      name: string;
      color: string;
      rate: number;
      activeSessions: number;
      cancelledSessions: number;
      earnings: number;
    }> = {};

    // Nhật ký lịch dạy từng ngày
    const sessionLog: Array<{
      id: string;
      className: string;
      dateDisplay: string;
      dayOfWeekLabel: string;
      time: string;
      rate: number;
      isCancelled: boolean;
      color: string;
    }> = [];

    const daysInMonth = new Date(year, month, 0).getDate();
    const daysOfWeekLabels = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

    for (let d = 1; d <= daysInMonth; d++) {
      const cellDateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dateObj = new Date(year, month - 1, d);
      const dow = dateObj.getDay();

      const activeSchedules = schedules.filter((s: any) => 
        s.day_of_week === dow &&
        s.valid_from <= cellDateStr &&
        (s.valid_to === null || cellDateStr <= s.valid_to)
      );

      activeSchedules.forEach((s: any) => {
        const cancelKey = `${s.class_id}_${cellDateStr}`;
        const isCancelled = !!cancelledSessions[cancelKey];

        if (!classBreakdownMap[s.class_id]) {
          classBreakdownMap[s.class_id] = {
            classId: s.class_id,
            name: s.name,
            color: s.type === 'FIXED' ? '#00B383' : '#FFB000',
            rate: s.rate_per_session,
            activeSessions: 0,
            cancelledSessions: 0,
            earnings: 0
          };
        }

        sessionLog.push({
          id: `${s.id}_${cellDateStr}`,
          className: s.name,
          dateDisplay: `${String(d).padStart(2, "0")}/${String(month).padStart(2, "0")}`,
          dayOfWeekLabel: daysOfWeekLabels[dow],
          time: `${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)}`,
          rate: s.rate_per_session,
          isCancelled,
          color: s.type === 'FIXED' ? '#00B383' : '#FFB000'
        });

        if (isCancelled) {
          cancelledCount += 1;
          classBreakdownMap[s.class_id].cancelledSessions += 1;
        } else {
          if (s.type === 'FIXED') {
            fixedCount += 1;
          } else {
            extraCount += 1;
          }
          totalSalary += s.rate_per_session;
          classBreakdownMap[s.class_id].activeSessions += 1;
          classBreakdownMap[s.class_id].earnings += s.rate_per_session;
        }
      });
    }

    // Sắp xếp nhật ký dạy học theo ngày tăng dần
    sessionLog.sort((a, b) => a.id.localeCompare(b.id));

    return {
      fixedCount,
      extraCount,
      cancelledCount,
      totalActive: fixedCount + extraCount,
      totalSalary,
      classSummaries: Object.values(classBreakdownMap).sort((a, b) => b.earnings - a.earnings),
      sessionLog
    };
  }, [year, month, schedules, cancelledSessions]);

  const totalExtraIncome = useMemo(() => {
    return extraIncomes
      .filter(item => item.status !== 'rejected')
      .reduce((sum, item) => sum + item.amount, 0);
  }, [extraIncomes]);

  const deletedByAdminIncomes = useMemo(() => {
    const dbKey = `${year}_${month}`;
    const deletedItems: any[] = [];
    const seenIds = new Set<string>();
    const currentIds = new Set(extraIncomes.map(item => item.id || item.name));
    
    auditLogs.forEach(log => {
      const oldList = log.old_value?.[dbKey] || [];
      const newList = log.new_value?.[dbKey] || [];
      
      const allLogItems = [...oldList, ...newList];
      allLogItems.forEach(item => {
        const itemId = item.id || item.name;
        if (!itemId || seenIds.has(itemId)) return;
        seenIds.add(itemId);
        
        const inOld = oldList.some((x: any) => (x.id || x.name) === itemId);
        const inNew = newList.some((x: any) => (x.id || x.name) === itemId);
        
        if (inOld && !inNew && !currentIds.has(itemId)) {
          const deletedItem = oldList.find((x: any) => (x.id || x.name) === itemId);
          if (deletedItem) {
            deletedItems.push(deletedItem);
          }
        }
      });
    });
    
    return deletedItems;
  }, [year, month, extraIncomes, auditLogs]);

  const finalSalary = stats.totalSalary + totalExtraIncome;

  // 5. Hàm xuất dữ liệu nhật ký học ra file CSV hỗ trợ tiếng Việt Excel
  const exportToCSV = () => {
    const removeAccents = (str: string): string => {
      if (!str) return "";
      return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D");
    };

    const headers = ["Ngay", "Thu", "Lop", "Khung gio", "Thu lao", "Trang thai"];
    
    const rows = stats.sessionLog.map(log => [
      log.dateDisplay,
      removeAccents(log.dayOfWeekLabel),
      `"${removeAccents(log.className).replace(/"/g, '""')}"`,
      log.time,
      log.isCancelled ? 0 : log.rate,
      log.isCancelled ? "Nghi" : "Da day"
    ]);

    // Append extra incomes
    extraIncomes.forEach(item => {
      const isRejected = item.status === 'rejected';
      if (isRejected) {
        rows.push([
          "",
          "",
          `"${removeAccents(item.name).replace(/"/g, '""')} (Bi Admin xoa: ${removeAccents(item.rejectReason || 'Khong hop le').replace(/"/g, '""')})"`,
          "-",
          0,
          "Bi tu choi"
        ]);
      } else {
        rows.push([
          "",
          "",
          `"${removeAccents(item.name).replace(/"/g, '""')} (Them)"`,
          "-",
          item.amount,
          "Khoan them"
        ]);
      }
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
    link.setAttribute("download", `SPeanut_thang_${month}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Ghi nhận nhật ký xuất Excel lên Database
    fetch('/api/admin/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'EXPORT_EXCEL', targetMonth: month, targetYear: year })
    }).catch(err => console.error("Lỗi khi ghi nhận nhật ký xuất Excel:", err));
  };

  return (
    <div className={styles.salaryWrapper}>
      {/* Thanh chọn tháng */}
      <section className={styles.monthHeader} aria-label="Month selection">
        <button className={styles.iconBtn} onClick={prevMonth} aria-label="Previous month">
          <ChevronLeft />
        </button>
        <div className={styles.monthLabel}>
          <h2 className={styles.monthName}>{MONTHS[month - 1]}</h2>
          <p className={styles.monthYear}>Năm {year}</p>
        </div>
        <button className={styles.iconBtn} onClick={nextMonth} aria-label="Next month">
          <ChevronRight />
        </button>
      </section>

      {/* Thẻ hiển thị tổng lương ước tính */}
      <section className={styles.balanceCard} aria-label="Monthly earnings summary">
        <div className={styles.balanceHeader}>
          <span className={styles.balanceLabel}>Tổng nhận ước tính</span>
          <Wallet className={styles.walletIcon} />
        </div>
        <h3 className={styles.balanceAmount}>
          {finalSalary.toLocaleString()}đ
        </h3>
        <p className={styles.balanceSub}>
          (Lương: {stats.totalSalary.toLocaleString()}đ • Thưởng: {totalExtraIncome.toLocaleString()}đ)
        </p>
      </section>

      {/* Grid thông số phụ */}
      <section className={styles.statsGrid} aria-label="Teaching metrics">
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Buổi đã dạy</span>
          <span className={styles.statValue} style={{ color: '#00B383' }}>
            {stats.totalActive} buổi
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Buổi nghỉ (Off)</span>
          <span className={styles.statValue} style={{ color: '#FF3B30' }}>
            {stats.cancelledCount} buổi
          </span>
        </div>
      </section>

      {/* Phân tích thu nhập theo từng lớp */}
      <section aria-labelledby="class-breakdown-heading">
        <h4 id="class-breakdown-heading" className={styles.sectionTitle}>Phân tích theo lớp học</h4>
        <div className={styles.summaryList}>
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : error ? (
            <p className={styles.noDataText} style={{ color: '#FF3B30' }}>Có lỗi xảy ra: {error}</p>
          ) : stats.classSummaries.length > 0 ? (
            stats.classSummaries.map((cls) => (
              <article key={cls.classId} className={styles.summaryCard}>
                <div className={styles.cardLeft}>
                  <span className={styles.cardDot} style={{ backgroundColor: cls.color }} />
                  <div className={styles.cardMeta}>
                    <span className={styles.cardName}>{cls.name}</span>
                    <span className={styles.cardSubText}>
                      Đơn giá: {cls.rate.toLocaleString()}đ / buổi
                    </span>
                  </div>
                </div>
                <div className={styles.cardRight}>
                  <span className={styles.cardSalary}>{cls.earnings.toLocaleString()}đ</span>
                  <p className={styles.cardSessions}>
                    {cls.activeSessions} buổi dạy {cls.cancelledSessions > 0 && `(Nghỉ ${cls.cancelledSessions})`}
                  </p>
                </div>
              </article>
            ))
          ) : (
            <p className={styles.noDataText}>Không có lịch dạy trong tháng này.</p>
          )}
        </div>
      </section>

      {/* Danh sách khoản thu thêm */}
      <section aria-labelledby="extra-income-heading">
        <h4 id="extra-income-heading" className={styles.sectionTitle}>Các khoản thu thêm khác</h4>
        <div className={styles.extraIncomeSection}>
          <form onSubmit={handleAddExtraIncome} className={styles.extraForm}>
            <input 
              type="text" 
              placeholder="Nội dung thu thêm (VD: Phụ cấp, thưởng...)" 
              value={extraName}
              onChange={(e) => setExtraName(e.target.value)}
              className={styles.extraInput}
              required
            />
            <input 
              type="number" 
              placeholder="Số tiền (đ)..." 
              value={extraAmount}
              onChange={(e) => setExtraAmount(e.target.value)}
              className={styles.extraInputAmount}
              required
            />
            <button type="submit" className={styles.extraAddBtn}>Thêm</button>
          </form>

           <div className={styles.extraList}>
            {extraIncomes.length === 0 && deletedByAdminIncomes.length === 0 ? (
              <p className={styles.extraEmptyText}>Chưa có khoản thu thêm nào trong tháng này.</p>
            ) : (
              <>
                {extraIncomes.map(item => {
                  const isRejected = item.status === 'rejected';
                  return (
                    <div 
                      key={item.id} 
                      className={styles.extraItem} 
                      style={isRejected ? { opacity: 0.75, borderLeft: '3px solid #ff3b30' } : undefined}
                    >
                      <div 
                        className={styles.extraItemLeft} 
                        style={isRejected ? { textDecoration: 'line-through', color: '#ff3b30' } : undefined}
                      >
                        <span className={styles.extraItemName}>{item.name}</span>
                      </div>
                      <div className={styles.extraItemRight}>
                        <span 
                          className={styles.extraItemAmount} 
                          style={isRejected ? { textDecoration: 'line-through', color: '#ff3b30', marginRight: '8px' } : undefined}
                        >
                          +{item.amount.toLocaleString()}đ
                        </span>
                        {isRejected ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', color: '#ff3b30', fontWeight: 'bold' }}>
                              (Admin xóa: {item.rejectReason})
                            </span>
                            <button 
                              type="button" 
                              onClick={() => handleDeleteExtraIncome(item.id)}
                              className={styles.extraDelBtn}
                              title="Xóa hẳn khỏi giao diện"
                              style={{ color: '#ff3b30' }}
                            >
                              Xóa
                            </button>
                          </div>
                        ) : (
                          <button 
                            type="button" 
                            onClick={() => handleDeleteExtraIncome(item.id)}
                            className={styles.extraDelBtn}
                            title="Xóa"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {deletedByAdminIncomes.map(item => (
                  <div key={item.id || item.name} className={styles.extraItem} style={{ opacity: 0.75, borderLeft: '3px solid #ff3b30' }}>
                    <div className={styles.extraItemLeft} style={{ textDecoration: 'line-through', color: '#ff3b30' }}>
                      <span className={styles.extraItemName}>{item.name}</span>
                    </div>
                    <div className={styles.extraItemRight}>
                      <span className={styles.extraItemAmount} style={{ textDecoration: 'line-through', color: '#ff3b30', marginRight: '8px' }}>
                        +{item.amount.toLocaleString()}đ
                      </span>
                      <span style={{ fontSize: '11px', color: '#ff3b30', fontWeight: 'bold' }}>
                        (Admin xóa)
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Thẻ xuất báo cáo chi tiết */}
      <section aria-label="Export section">
        <div className={styles.exportCard}>
          <div className={styles.exportCardLeft}>
            <Calendar className={styles.exportCardIcon} />
            <div className={styles.exportCardMeta}>
              <span className={styles.exportCardTitle}>Nhật ký dạy học chi tiết</span>
              <p className={styles.exportCardDesc}>
                {loading ? "Đang xử lý dữ liệu..." : stats.sessionLog.length > 0 ? `Tải file chi tiết các buổi dạy trong tháng ${month}/${year}` : "Không có dữ liệu buổi học trong tháng này"}
              </p>
            </div>
          </div>
          {!loading && !error && stats.sessionLog.length > 0 && (
            <button 
              type="button" 
              onClick={exportToCSV}
              className={styles.exportBtn}
            >
              Tải xuống
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
