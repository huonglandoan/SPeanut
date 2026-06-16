'use client'
import React, { useState, useEffect } from 'react';
import styles from '../styles/Class.module.css';
import { GroupedClassDisplay } from '../services/class' 
import { Trash2, SquarePen, Settings, Repeat } from 'lucide-react';

export default function FixedClassForm({ activeNav }: { activeNav?: number }) {
  // --- CHUYỂN TAB TRÊN DI ĐỘNG ---
  const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE'>('LIST');

  // --- STATE CỦA FORM TẠO MỚI ---
  const [classType, setClassType] = useState<'FIXED' | 'EXTRA'>('EXTRA');
  const [name, setName] = useState('');
  const [short_name, setShort_Name] = useState('');
  const [start_time, setStart_Time] = useState('18:00'); 
  const [end_time, setEnd_Time] = useState('20:00');
  const [rate_per_session, setRate_Per_Session] = useState('');
  const [valid_from, setValid_From] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  // --- STATE GỢI Ý TÊN LỚP ---
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);

  // --- STATE QUẢN LÝ DANH SÁCH & LOGIC ---
  const [classes, setClasses] = useState<GroupedClassDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // --- STATE PHỤC VỤ CHỨC NĂNG ĐỔI LỊCH (EDIT NGẦM) ---
  const [changingScheduleClassId, setChangingScheduleClassId] = useState<number | null>(null);
  const [editStartTime, setEditStartTime] = useState('18:00');
  const [editEndTime, setEditEndTime] = useState('20:00');
  const [editSelectedDays, setEditSelectedDays] = useState<number[]>([]);
  const [editValidFrom, setEditValidFrom] = useState(new Date().toISOString().split('T')[0]);
  const [editName, setEditName] = useState('');
  const [editRatePerSession, setEditRatePerSession] = useState('');
  const [editRateEffectiveDate, setEditRateEffectiveDate] = useState('');

  // --- STATE QUẢN LÝ NHÓM LỚP MỞ RỘNG (các tháng cũ) ---
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const daysOfWeekLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  const fetchClasses = async () => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('speanut_tour_mode') === 'true') {
        const storedClasses = localStorage.getItem('speanut_tour_classes');
        if (storedClasses) {
          setClasses(JSON.parse(storedClasses));
        } else {
          const defaultClasses: GroupedClassDisplay[] = [
            { id: 9001, name: "Toán 7", short_name: "T7", rate_per_session: 150000, type: "FIXED", days: ["T2"], start_time: "18:00", end_time: "20:00", valid_from: "2026-01-01" },
            { id: 9002, name: "Anh 8", short_name: "A8", rate_per_session: 180000, type: "FIXED", days: ["T3"], start_time: "19:30", end_time: "21:30", valid_from: "2026-01-01" },
            { id: 9003, name: "Lý 11", short_name: "L11", rate_per_session: 200000, type: "FIXED", days: ["T5"], start_time: "17:00", end_time: "19:00", valid_from: "2026-01-01" },
          ];
          setClasses(defaultClasses);
          localStorage.setItem('speanut_tour_classes', JSON.stringify(defaultClasses));
        }
        return;
      }
      const res = await fetch('/api/class');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi tải danh sách.");
      setClasses(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (activeNav === 0) {
      fetchClasses();
    }
  }, [activeNav]);

  // Tự động điền dữ liệu mẫu khi ở chế độ Tour chạy thử (Bước 7)
  useEffect(() => {
    if (
      typeof window !== 'undefined' && 
      localStorage.getItem('speanut_tour_mode') === 'true' && 
      localStorage.getItem('speanut_tour_step') === '7' && 
      activeTab === 'CREATE'
    ) {
      setName("Hóa 10");
      setShort_Name("H10");
      setRate_Per_Session("250000");
      setClassType("FIXED");
      setSelectedDays([1, 3]); // Thứ 2 (1), Thứ 4 (3)
      setStart_Time("17:30");
      setEnd_Time("19:30");
    }
  }, [activeTab]);

  const toggleDay = (dayIndex: number, isEdit: boolean) => {
    if (isEdit) {
      setEditSelectedDays(prev => prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]);
    } else {
      setSelectedDays(prev => prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]);
    }
  };

  const handleConfirmChangeSchedule = async (classId: number) => {
    setLoading(true); setError(null); setSuccess(null);
    try {
      const originalClass = classes.find(c => c.id === classId);
      if (!originalClass) throw new Error("Không tìm thấy thông tin lớp học gốc.");

      const payload: any = { classId };

      // 1. Kiểm tra thay đổi tên
      if (editName.trim() && editName.trim() !== originalClass.name) {
        payload.name = editName.trim();
      }

      // 2. Kiểm tra thay đổi thù lao
      if (editRatePerSession && Number(editRatePerSession) !== originalClass.rate_per_session) {
        payload.rate_per_session = Number(editRatePerSession);
        if (editRateEffectiveDate) {
          payload.effectiveDate = editRateEffectiveDate;
        }
      }

      // 3. Kiểm tra thay đổi lịch dạy (chỉ áp dụng cho lớp FIXED)
      if (originalClass.type === 'FIXED') {
        const currentDaysIndices = (originalClass.days || []).map(d => daysOfWeekLabels.indexOf(d)).filter(idx => idx !== -1);
        const daysChanged = JSON.stringify([...editSelectedDays].sort()) !== JSON.stringify([...currentDaysIndices].sort());
        const timesChanged = editStartTime !== originalClass.start_time || editEndTime !== originalClass.end_time;

        if (daysChanged || timesChanged) {
          if (editSelectedDays.length === 0) {
            alert("Vui lòng chọn ít nhất một thứ mới cho lịch học cố định.");
            setLoading(false);
            return;
          }
          payload.editSelectedDays = editSelectedDays;
          payload.editValidFrom = editValidFrom;
          payload.editStartTime = editStartTime;
          payload.editEndTime = editEndTime;
        }
      }

      // Nếu không có bất kỳ thay đổi nào
      if (Object.keys(payload).length === 1) {
        setChangingScheduleClassId(null);
        setLoading(false);
        return;
      }

      const res = await fetch('/api/class', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể cập nhật lớp học.");

      setSuccess("Cập nhật lớp học thành công!");
      setChangingScheduleClassId(null);
      fetchClasses();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi cập nhật lớp.");
    } finally { setLoading(false); }
  };

  const handleOpenChangeScheduleForm = (cls: GroupedClassDisplay) => {
    setChangingScheduleClassId(changingScheduleClassId === cls.id ? null : cls.id);
    setEditStartTime(cls.start_time || '18:00');
    setEditEndTime(cls.end_time || '20:00');
    setEditValidFrom(new Date().toISOString().split('T')[0]);
    // Khởi tạo các thứ đã chọn trước đó
    const currentDaysIndices = (cls.days || []).map(d => daysOfWeekLabels.indexOf(d)).filter(idx => idx !== -1);
    setEditSelectedDays(currentDaysIndices);

    // Khởi tạo tên và thù lao
    setEditName(cls.name);
    setEditRatePerSession(String(cls.rate_per_session));
    setEditRateEffectiveDate(''); // Để trống ngày áp dụng thù lao mới mặc định
  };

  const handleRepeatClassForNextMonth = async (classId: number) => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch('/api/class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'repeat',
          classId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể lặp lại lớp học.");
      
      setSuccess(data.message || "Đã lặp lại lịch dạy sang tháng sau thành công!");
      fetchClasses();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (classId: number) => {
    const confirmDelete = window.confirm("Xóa lớp học sẽ xóa toàn bộ lịch sử. Bạn có chắc chắn?");
    if (!confirmDelete) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/class?id=${classId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess("Xóa lớp thành công!");
      fetchClasses();
    } catch (err: any) { 
      setError(err.message); 
    } finally { setLoading(false); }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(null); setSuccess(null);

    if (!name.trim() || !short_name.trim() || !rate_per_session) {
      setError("Vui lòng điền đầy đủ thông tin."); return;
    }
    if (classType === 'FIXED' && selectedDays.length === 0) {
      setError("Vui lòng chọn thứ."); return;
    }

    setLoading(true);
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('speanut_tour_mode') === 'true') {
        await new Promise(r => setTimeout(r, 500));
        const newClass: GroupedClassDisplay = {
          id: Date.now(),
          name: name.trim(),
          short_name: short_name.trim(),
          rate_per_session: Number(rate_per_session),
          type: classType,
          days: classType === 'FIXED' ? selectedDays.map(d => daysOfWeekLabels[d]) : [],
          start_time,
          end_time,
          valid_from
        };
        const updatedClasses = [newClass, ...classes];
        setClasses(updatedClasses);
        localStorage.setItem('speanut_tour_classes', JSON.stringify(updatedClasses));

        // Sync local schedules
        const storedSchedules = localStorage.getItem('speanut_tour_schedules');
        const schedulesList = storedSchedules ? JSON.parse(storedSchedules) : [];
        if (classType === 'FIXED') {
          selectedDays.forEach(day => {
            schedulesList.push({
              id: Date.now() + day,
              class_id: newClass.id,
              name: newClass.name,
              short_name: newClass.short_name,
              rate_per_session: newClass.rate_per_session,
              type: classType,
              day_of_week: day,
              start_time,
              end_time,
              valid_from,
              valid_to: null
            });
          });
        } else {
          schedulesList.push({
            id: Date.now(),
            class_id: newClass.id,
            name: newClass.name,
            short_name: newClass.short_name,
            rate_per_session: newClass.rate_per_session,
            type: classType,
            day_of_week: new Date(valid_from).getDay(),
            start_time,
            end_time,
            valid_from,
            valid_to: null
          });
        }
        localStorage.setItem('speanut_tour_schedules', JSON.stringify(schedulesList));

        setSuccess("Tạo lớp thành công!");
        setName(''); setShort_Name(''); setRate_Per_Session(''); setSelectedDays([]);
        setLoading(false);
        setActiveTab('LIST');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('speanut_tour_event', { detail: { type: 'class_created', class: newClass } }));
        }
        return;
      }

      const res = await fetch('/api/class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, short_name, rate_per_session: Number(rate_per_session), type: classType,
          selectedDays, start_time, end_time, valid_from
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess("Tạo lớp thành công!");
      setName(''); setShort_Name(''); setRate_Per_Session(''); setSelectedDays([]);
      fetchClasses();
      setActiveTab('LIST');
    } catch (err: any) { 
      setError(err.message); 
    } finally { setLoading(false); }
  };

  // --- Nhóm classes theo tên, mới nhất lên đầu mỗi nhóm ---
  const classGroups = React.useMemo(() => {
    const groups: Record<string, GroupedClassDisplay[]> = {};
    classes.forEach(cls => {
      const key = cls.name;
      if (!groups[key]) groups[key] = [];
      groups[key].push(cls);
    });
    Object.values(groups).forEach(grp =>
      grp.sort((a, b) => (b.valid_from || '').localeCompare(a.valid_from || ''))
    );
    return groups;
  }, [classes]);

  // --- Danh sách tên lớp duy nhất (dùng để gợi ý) ---
  const uniqueClassNames = React.useMemo(() => {
    const seen = new Map<string, GroupedClassDisplay>();
    classes.forEach(cls => {
      if (!seen.has(cls.name)) seen.set(cls.name, cls);
    });
    return Array.from(seen.values());
  }, [classes]);

  // Lọc gợi ý theo text user đang gõ
  const filteredSuggestions = React.useMemo(() => {
    if (!name.trim()) return uniqueClassNames;
    const q = name.toLowerCase();
    return uniqueClassNames.filter(c => c.name.toLowerCase().includes(q));
  }, [name, uniqueClassNames]);

  // Chọn gợi ý → auto-fill tên, mã viết tắt, thù lao
  const handleSelectSuggestion = (cls: GroupedClassDisplay) => {
    setName(cls.name);
    setShort_Name(cls.short_name);
    setRate_Per_Session(String(cls.rate_per_session));
    setShowNameSuggestions(false);
  };

  // Khi thay đổi giờ bắt đầu → tự tính giờ kết thúc (+2 giờ)
  const handleStartTimeChange = (val: string) => {
    setStart_Time(val);
    if (val) {
      const [h, m] = val.split(':').map(Number);
      const endH = (h + 2) % 24;
      setEnd_Time(`${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  };

  return (
    <div className={styles.Card}>
      {/* --- THANH CHUYỂN TAB --- */}
      <div className={styles.tabWrapper}>
        <button 
          type="button" 
          onClick={() => { setActiveTab('LIST'); setError(null); setSuccess(null); }}
          className={activeTab === 'LIST' ? styles.dayBtnActive : styles.dayBtn}
        >
           Danh sách ({classes.length})
        </button>
        <button 
          type="button" 
          id="tour-create-class-tab"
          onClick={() => { 
            setActiveTab('CREATE'); 
            setError(null); 
            setSuccess(null); 
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('speanut_tour_event', { detail: { type: 'class_tab_changed', activeTab: 'CREATE' } }));
            }
          }}
          className={activeTab === 'CREATE' ? styles.dayBtnActive : styles.dayBtn}
        >
          Tạo lớp mới
        </button>
      </div>

      {error && <p className={styles.errorText}>{error}</p>}
      {success && <p className={styles.successText}>{success}</p>}

      {/* ================= TAB 1: DANH SÁCH LỚP (nhóm theo tên) ================= */}
      {activeTab === 'LIST' && (
        <div className={styles.classList}>
          {classes.length === 0 && (
            <p className={styles.emptyText}>Chưa có lớp học nào.</p>
          )}

          {Object.entries(classGroups).map(([groupName, grp]) => {
            const newest = grp[0];
            const older = grp.slice(1);
            const isExpanded = expandedGroups[groupName];

            return (
              <div key={groupName} className={styles.classGroup}>
                {/* --- LỚP MỚI NHẤT (hiển thị đầy đủ) --- */}
                <div className={styles.classItemCardMini}>
                  <div style={{ flex: 1 }}>
                    <div className={styles.cardTop}>
                      <div className={styles.cardLeft}>
                        <span 
                          className={styles.cardDot} 
                          style={{ backgroundColor: newest.type === 'FIXED' ? '#00B383' : '#FFB000' }}
                        />
                        <span className={styles.cardTime}>
                          {newest.start_time} - {newest.end_time}
                        </span>
                      </div>
                    </div>

                    <div className={styles.classMeta}>
                      <h3 className={styles.classNameText}>
                        {newest.name} <span className={styles.classSubText}>({newest.short_name})</span>
                      </h3>
                      <p className={styles.classSubText}>
                        {newest.type === 'FIXED' ? (
                          <>Thứ: {newest.days?.join(', ')}  từ {newest.valid_from?.split('-').reverse().join('/')}</>
                        ) : (
                          <>Extra · {newest.days?.join(', ')} · {newest.valid_from?.split('-').reverse().join('/')}</>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className={styles.classRightSide}>
                    <div className={styles.classRateText}>
                      {newest.rate_per_session.toLocaleString()}đ
                    </div>
                    <div className={styles.actionButtons}>
                      {newest.type === 'FIXED' && (
                        <>
                          <button 
                            type="button" 
                            title="Lặp lại lịch tháng sau" 
                            onClick={() => handleRepeatClassForNextMonth(newest.id)} 
                            className={styles.miniActionBtnMini} 
                            disabled={loading}
                          >
                            <Repeat size={16} />
                          </button>
                          <button 
                            type="button" 
                            title="Đổi lịch" 
                            onClick={() => handleOpenChangeScheduleForm(newest)} 
                            className={styles.miniActionBtnMini}
                          >
                            <SquarePen size={16}/>
                          </button>
                        </>
                      )}
                      <button type="button" title="Xóa lớp" onClick={() => handleDeleteClick(newest.id)} className={styles.miniActionBtnMini} disabled={loading}><Trash2 size={16} /></button>
                    </div>
                  </div>

                  {/* KHUNG CHỈNH SỬA LỚP HỌC (BUNG NỞ INLINE) */}
                  {changingScheduleClassId === newest.id && (
                    <div className={styles.inlineEditPanel} style={{ width: '100%', gridColumn: '1 / -1', marginTop: '10px' }}>
                      <p className={styles.editPanelTitle}><Settings size={16}/> Chỉnh sửa lớp học:</p>
                      
                      {/* Tên lớp & Thù lao */}
                      <div className={styles.fieldPanel} style={{ marginBottom: '10px' }}>
                        <label className={styles.fieldLabel}>Tên lớp học:</label>
                        <input 
                          type="text" 
                          className={styles.fieldInput} 
                          value={editName} 
                          onChange={(e) => setEditName(e.target.value)} 
                          placeholder="Tên lớp học..."
                        />
                      </div>

                      <div className={styles.fieldRow} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label className={styles.fieldLabel}>Thù lao / buổi:</label>
                          <input 
                            type="number" 
                            className={styles.fieldInput} 
                            value={editRatePerSession} 
                            onChange={(e) => setEditRatePerSession(e.target.value)} 
                            placeholder="Thù lao..."
                          />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label className={styles.fieldLabel}>Lương mới áp dụng từ ngày:</label>
                          <input 
                            type="date" 
                            className={styles.fieldInput} 
                            value={editRateEffectiveDate} 
                            onChange={(e) => setEditRateEffectiveDate(e.target.value)} 
                          />
                        </div>
                      </div>
                      <p style={{ fontSize: '11px', color: '#86868b', marginTop: '-4px', marginBottom: '12px', paddingLeft: '8px', textAlign: 'left' }}>
                        * Để trống ngày áp dụng nếu muốn thay đổi thù lao cho toàn bộ lịch sử lớp học. Điền ngày nếu muốn tách lương mới kể từ ngày đó.
                      </p>

                      {/* Lịch dạy (Chỉ hiển thị cho lớp FIXED) */}
                      {newest.type === 'FIXED' && (
                        <>
                          <div className={styles.fieldPanel} style={{ marginBottom: '10px' }}>
                            <label className={styles.fieldLabel}>Khung giờ học mới:</label>
                            <div className={styles.fieldRow} style={{ display: 'flex', gap: '8px' }}>
                              <div style={{ flex: 1 }}>
                                <input type="time" className={styles.fieldInput} value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <input type="time" className={styles.fieldInput} value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} />
                              </div>
                            </div>
                          </div>
                          
                          <div className={styles.fieldPanel} style={{ marginBottom: '10px' }}>
                            <label className={styles.fieldLabel}>Lịch mới áp dụng từ ngày:</label>
                            <input type="date" className={styles.fieldInput} value={editValidFrom} onChange={(e) => setEditValidFrom(e.target.value)} />
                          </div>

                          <div className={styles.fieldPanel} style={{ marginBottom: '12px' }}>
                            <label className={styles.fieldLabel}>Lịch dạy cố định hàng tuần mới:</label>
                            <div className={styles.weekGrid}>
                              {daysOfWeekLabels.map((label, index) => (
                                <button 
                                  key={index} 
                                  type="button" 
                                  onClick={() => toggleDay(index, true)} 
                                  className={`${styles.dayBtn} ${editSelectedDays.includes(index) ? styles.dayBtnActive : ''}`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
                        <button type="button" onClick={() => handleConfirmChangeSchedule(newest.id)} disabled={loading} className={styles.buttonPrimary} style={{ margin: 0, width: '70%' }}>LƯU THAY ĐỔI</button>
                        <button type="button" onClick={() => setChangingScheduleClassId(null)} className={styles.dayBtn} style={{ padding: '0', borderRadius: '9999px' }}>HỦY</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* --- CÁC BẢN THÁNG CŨ HƠN (collapse/expand) --- */}
                {older.length > 0 && (
                  <div className={styles.olderCopiesWrap}>
                    <button
                      type="button"
                      className={styles.olderToggleBtn}
                      onClick={() => setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }))}
                    >
                      <span className={styles.olderToggleIcon}>{isExpanded ? '▲' : '▼'}</span>
                      {isExpanded ? 'Ẩn bớt' : `${older.length} tháng cũ hơn`}
                    </button>

                    {isExpanded && older.map(cls => (
                      <div key={cls.id} className={styles.classItemCardOld}>
                        <div style={{ flex: 1 }}>
                          <p className={styles.classSubText} style={{ margin: 0 }}>
                            <span style={{ fontWeight: 600 }}>{cls.days?.join(', ') || 'Extra'}</span>
                            {' · '}từ {cls.valid_from?.split('-').reverse().join('/')}
                            {' · '}{cls.start_time}–{cls.end_time}
                          </p>
                        </div>
                        <button type="button" title="Xóa tháng này" onClick={() => handleDeleteClick(cls.id)} className={styles.miniActionBtnMini} disabled={loading}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ================= TAB 2: FORM TẠO MỚI  ================= */}
      {activeTab === 'CREATE' && (
        <form onSubmit={handleSubmit} className={styles.formScrollable}>
          {/* LỰA CHỌN LỚP CỐ ĐỊNH */}
          <div className={styles.checkboxPanel} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', margin: '4px 0' }}>
            <input 
              type="checkbox" 
              id="isFixed" 
              checked={classType === 'FIXED'} 
              onChange={(e) => setClassType(e.target.checked ? 'FIXED' : 'EXTRA')}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary, #6366f1)' }}
            />
            <label htmlFor="isFixed" style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-title)', cursor: 'pointer', userSelect: 'none' }}>
              Lặp lại cố định hàng tuần (Cố định)
            </label>
          </div>

          {/* TÊN LỚP HỌC (có dropdown gợi ý) */}
          <div className={styles.fieldPanel} style={{ position: 'relative' }}>
            <input
              type="text"
              className={styles.fieldInput}
              placeholder="Tên lớp học..."
              value={name}
              onChange={(e) => { setName(e.target.value); setShowNameSuggestions(true); }}
              onFocus={() => setShowNameSuggestions(true)}
              onBlur={() => setTimeout(() => setShowNameSuggestions(false), 200)}
              disabled={loading}
              autoComplete="off"
            />
            {showNameSuggestions && filteredSuggestions.length > 0 && (
              <div className={styles.suggestDropdown}>
                {filteredSuggestions.map(cls => (
                  <button
                    key={cls.id}
                    type="button"
                    className={styles.suggestItem}
                    onMouseDown={() => handleSelectSuggestion(cls)}
                  >
                    <span className={styles.suggestName}>{cls.name}</span>
                    <span className={styles.suggestMeta}>{cls.short_name} · {cls.rate_per_session.toLocaleString()}đ</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* MÃ VIẾT TẮT */}
          <div className={styles.fieldPanel}>
            <input type="text" className={styles.fieldInput} placeholder="Mã viết tắt (Ví dụ: T9CB1)..." value={short_name} onChange={(e) => setShort_Name(e.target.value)} disabled={loading} />
          </div>

          {/* THÙ LAO */}
          <div className={styles.fieldPanel}>
            <input type="number" className={styles.fieldInput} placeholder="Thù lao / buổi (VNĐ)..." value={rate_per_session} onChange={(e) => setRate_Per_Session(e.target.value)} disabled={loading} />
            <div className={styles.rateChips}>
              {[150000, 180000, 200000, 230000, 250000].map(r => (
                <button
                  key={r}
                  type="button"
                  className={`${styles.rateChip} ${Number(rate_per_session) === r ? styles.rateChipActive : ''}`}
                  onClick={() => setRate_Per_Session(String(r))}
                >
                  {(r / 1000)}k
                </button>
              ))}
            </div>
          </div>

          {/* KHUNG GIỜ HỌC */}
          <div className={styles.fieldPanel}>
            <label className={styles.fieldLabel}>
              Khung giờ học (Từ - Đến):
            </label>
            <div className={styles.fieldRow}>
              <div style={{ flex: 1 }}>
                <input 
                  type="time" 
                  className={styles.fieldInput} 
                  value={start_time} 
                  onChange={(e) => handleStartTimeChange(e.target.value)} 
                  disabled={loading} 
                />
              </div>
              <div style={{ flex: 1 }}>
                <input 
                  type="time" 
                  className={styles.fieldInput} 
                  value={end_time} 
                  onChange={(e) => setEnd_Time(e.target.value)} 
                  disabled={loading} 
                />
              </div>
            </div>
          </div>

          {/* XỬ LÝ ĐỔI LOGIC NGÀY DỰA TRÊN LOẠI LỚP */}
          <div className={styles.fieldPanel}>
            {classType === 'FIXED' ? (
              <>
                <label className={styles.fieldLabel}>
                  Ngày bắt đầu áp dụng lịch:
                </label>
                <input type="date" className={styles.fieldInput} value={valid_from} onChange={(e) => setValid_From(e.target.value)} disabled={loading} />
              </>
            ) : (
              <>
                <label className={styles.fieldLabel}>
                  Ngày dạy lớp Extra:
                </label>
                <input type="date" className={styles.fieldInput} value={valid_from} onChange={(e) => setValid_From(e.target.value)} disabled={loading} />
              </>
            )}
          </div>

          {/* LỊCH DẠY THEO THỨ (Chỉ hiển thị khi chọn lớp CỐ ĐỊNH) */}
          {classType === 'FIXED' && (
            <div className={styles.fieldPanel}>
              <label className={styles.fieldLabel}>
                Lịch dạy cố định hàng tuần:
              </label>
              <div className={styles.weekGrid}>
                {daysOfWeekLabels.map((label, index) => (
                  <button 
                    key={index} 
                    type="button" 
                    onClick={() => toggleDay(index, false)} 
                    className={`${styles.dayBtn} ${selectedDays.includes(index) ? styles.dayBtnActive : ''}`}
                    disabled={loading}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* NÚT SUBMIT */}
          <button type="submit" id="tour-create-class-submit" className={styles.buttonPrimary} disabled={loading}>
            {loading ? "ĐANG LƯU..." : "KHỞI TẠO LỚP HỌC"}
          </button>
        </form>
      )}
    </div>
  );
}