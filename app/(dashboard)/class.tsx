'use client'
import React, { useState, useEffect } from 'react';
import styles from '../styles/Class.module.css';
import { GroupedClassDisplay } from '../services/class' 
import { Trash2, SquarePen , Settings} from 'lucide-react';

export default function FixedClassForm() {
  // --- CHUYỂN TAB TRÊN DI ĐỘNG ---
  const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE'>('LIST');

  // --- STATE CỦA FORM TẠO MỚI ---
  const [classType, setClassType] = useState<'FIXED' | 'EXTRA'>('FIXED');
  const [name, setName] = useState('');
  const [short_name, setShort_Name] = useState('');
  const [start_time, setStart_Time] = useState('18:00'); 
  const [end_time, setEnd_Time] = useState('20:00');
  const [rate_per_session, setRate_Per_Session] = useState('');
  const [valid_from, setValid_From] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

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

  const daysOfWeekLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  const fetchClasses = async () => {
    try {
       const res = await fetch('/api/class');
       const data = await res.json();
       if (!res.ok) throw new Error(data.error || "Lỗi tải danh sách.");
      setClasses(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => { fetchClasses(); }, []);

 const toggleDay = (dayIndex: number, isEdit: boolean) => {
    if (isEdit) {
      setEditSelectedDays(prev => prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]);
    } else {
      setSelectedDays(prev => prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]);
    }
  };

  const handleConfirmChangeSchedule = async (classId: number) => {
    if (editSelectedDays.length === 0) {
      alert("Vui lòng chọn ít nhất một thứ mới.");
      return;
    }
    setLoading(true); setError(null); setSuccess(null);
    try {
      const res = await fetch('/api/class', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId,
          editSelectedDays,
          editValidFrom,
          editStartTime,
          editEndTime
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess("Đổi lịch dạy thành công!");
      setChangingScheduleClassId(null);
      fetchClasses();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi đổi lịch.");
    } finally { setLoading(false); }
  };

  const handleOpenChangeScheduleForm = (cls: GroupedClassDisplay) => {
    setChangingScheduleClassId(changingScheduleClassId === cls.id ? null : cls.id);
    setEditStartTime(cls.start_time || '18:00');
    setEditEndTime(cls.end_time || '20:00');
    setEditValidFrom(new Date().toISOString().split('T')[0]);
    setEditSelectedDays([]);
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
          onClick={() => { setActiveTab('CREATE'); setError(null); setSuccess(null); }}
          className={activeTab === 'CREATE' ? styles.dayBtnActive : styles.dayBtn}
        >
          Tạo lớp mới
        </button>
      </div>

      {error && <p className={styles.errorText}>{error}</p>}
      {success && <p className={styles.successText}>{success}</p>}

      {/* ================= TAB 1: DANH SÁCH LỚP MINI ================= */}
      {activeTab === 'LIST' && (
        <div className={styles.classList}>
          {classes.length === 0 && (
            <p className={styles.emptyText}>Chưa có lớp học nào.</p>
          )}
          
          {classes.map((cls) => (
            <div key={cls.id} className={styles.classItemCardMini}>
              <div style={{ flex: 1 }}>
                {/* Top Card: Thời gian và Chấm màu sắc */}
                <div className={styles.cardTop}>
                  <div className={styles.cardLeft}>
                    <span 
                      className={styles.cardDot} 
                      style={{ backgroundColor: cls.type === 'FIXED' ? 'var(--primary)' : '#7928ca' }}
                    />
                    <span className={styles.cardTime}>
                      {cls.type === 'FIXED' ? <>{cls.start_time} - {cls.end_time}</> : <>Lịch linh hoạt</>}
                    </span>
                  </div>
                </div>

                {/* Giữa Card: Thông tin Metadata */}
                <div className={styles.classMeta}>
                  <h3 className={styles.classNameText}>
                    {cls.name} <span className={styles.classSubText}>({cls.short_name})</span>
                  </h3>
                  <p className={styles.classSubText}>
                    {cls.type === 'FIXED' ? (
                      <>Thứ: {cls.days?.join(', ')}  từ {cls.valid_from?.split('-').reverse().join('/')}</>
                    ) : (
                      <>Thiết lập trực tiếp từng buổi trên Lịch Tháng</>
                    )}
                  </p>
                </div>
              </div>

              {/* Bên phải Card: Tiền lương & Cặp nút bấm nhỏ gọn */}
              <div className={styles.classRightSide}>
                <div className={styles.classRateText}>
                  {cls.rate_per_session.toLocaleString()}đ
                </div>
                <div className={styles.actionButtons}>
                  {cls.type === 'FIXED' && (
                    <button type="button" title="Đổi lịch" onClick={() => handleOpenChangeScheduleForm(cls)} className={styles.miniActionBtnMini}><SquarePen size={16}/></button>
                  )}
                  <button type="button" title="Xóa lớp" onClick={() => handleDeleteClick(cls.id)} className={styles.miniActionBtnMini} disabled={loading}><Trash2 size={16} /></button>
                </div>
              </div>

              {/* KHUNG ĐỔI LỊCH DẠY (BUNG NỞ INLINE) */}
              {changingScheduleClassId === cls.id && (
                <div className={styles.inlineEditPanel} style={{ width: '100%', gridColumn: '1 / -1', marginTop: '10px' }}>
                  <p className={styles.editPanelTitle}>< Settings size={16}/> Đổi lịch mới:</p>
                  <div className={styles.fieldRow} style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <input type="time" className={styles.fieldInput} value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <input type="time" className={styles.fieldInput} value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ margin: '8px 0' }}>
                    <input type="date" className={styles.fieldInput} value={editValidFrom} onChange={(e) => setEditValidFrom(e.target.value)} />
                  </div>
                  <div className={styles.weekGrid} style={{ marginBottom: '12px' }}>
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
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button type="button" onClick={() => handleConfirmChangeSchedule(cls.id)} disabled={loading} className={styles.buttonPrimary} style={{ margin: 0, width: '70%' }}>XÁC NHẬN</button>
                    <button type="button" onClick={() => setChangingScheduleClassId(null)} className={styles.dayBtn} style={{ padding: '0', borderRadius: '9999px' }}>HỦY</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ================= TAB 2: FORM TẠO MỚI  ================= */}
      {activeTab === 'CREATE' && (
        <form onSubmit={handleSubmit} className={styles.formScrollable}>
          {/* CHỌN LOẠI LỚP HỌC */}
          <div className={styles.fieldPanel}>
            <div style={{ display: 'flex', gap: '8px', backgroundColor: '#f5f5f7', padding: '4px', borderRadius: '9999px' }}>
              <button 
                type="button" 
                className={classType === 'FIXED' ? styles.dayBtnActive : styles.dayBtn} 
                style={{ border: 'none', padding: '10px 0' }} 
                onClick={() => setClassType('FIXED')}
              >
                CỐ ĐỊNH
              </button>
              <button 
                type="button" 
                className={classType === 'EXTRA' ? styles.dayBtnActive : styles.dayBtn} 
                style={{ border: 'none', padding: '10px 0' }} 
                onClick={() => setClassType('EXTRA')}
              >
                EXTRA
              </button>
            </div>
          </div>

          {/* TÊN LỚP HỌC */}
        <div className={styles.fieldPanel}>
          <input type="text" className={styles.fieldInput} placeholder="Tên lớp học..." value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
        </div>

        {/* MÃ VIẾT TẮT */}
        <div className={styles.fieldPanel}>
          <input type="text" className={styles.fieldInput} placeholder="Mã viết tắt (Ví dụ: T9CB1)..." value={short_name} onChange={(e) => setShort_Name(e.target.value)} disabled={loading} />
        </div>

        {/* THÙ LAO */}
        <div className={styles.fieldPanel}>
          <input type="number" className={styles.fieldInput} placeholder="Thù lao / buổi (VNĐ)..." value={rate_per_session} onChange={(e) => setRate_Per_Session(e.target.value)} disabled={loading} />
        </div>


         {/* XỬ LÝ ĐỔI LOGIC NGÀY DỰA TRÊN LOẠI LỚP */}
    <div className={styles.fieldPanel}>
      {classType === 'FIXED' ? (
        <>
          <label className={styles.classSubText} style={{ paddingLeft: '10px', fontWeight: '600', marginBottom: '-4px' }}>
            Ngày bắt đầu áp dụng lịch:
          </label>
          <input type="date" className={styles.fieldInput} value={valid_from} onChange={(e) => setValid_From(e.target.value)} disabled={loading} />
        </>
      ) : (
        <>
          <label className={styles.classSubText} style={{ paddingLeft: '10px', fontWeight: '600', marginBottom: '-4px' }}>
            Ngày dạy lớp Extra:
          </label>
          {/* Đối với EXTRA, bạn có thể lưu chung vào state valid_from hoặc đổi thành một state khác như extra_date tùy cấu trúc API của bạn */}
          <input type="date" className={styles.fieldInput} value={valid_from} onChange={(e) => setValid_From(e.target.value)} disabled={loading} />
        </>
      )}
    </div>

    {/* LỊCH DẠY THEO THỨ (Chỉ hiển thị khi chọn lớp CỐ ĐỊNH) */}
    {classType === 'FIXED' && (
      <div className={styles.fieldPanel}>
        <label className={styles.classSubText} style={{ paddingLeft: '10px', fontWeight: '600' }}>
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
    <button type="submit" className={styles.buttonPrimary} disabled={loading}>
      {loading ? "ĐANG LƯU..." : "KHỞI TẠO LỚP HỌC"}
    </button>
  </form>
      )}
    </div>
  );
}