'use client'
import React, { useState, useEffect } from 'react';
import styles from '../styles/Class.module.css';
import { supabase } from '@/lib/supabase';

interface GroupedClassDisplay {
  id: number;
  name: string;
  short_name: string;
  rate_per_session: number;
  type: 'FIXED' | 'EXTRA';
  days?: string[]; 
  start_time?: string;
  end_time?: string;
  valid_from?: string;
}

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
      const { data: classesData, error: classErr } = await supabase
        .from('classes')
        .select('*')
        .order('id', { ascending: false });

      if (classErr) throw classErr;
      if (!classesData) return;

      const { data: schedulesData, error: scheduleErr } = await supabase
        .from('class_schedules')
        .select('*')
        .is('valid_to', null);

      if (scheduleErr) throw scheduleErr;

      const formattedClasses: GroupedClassDisplay[] = classesData.map((cls) => {
        if (cls.type === 'EXTRA') {
          return { id: cls.id, name: cls.name, short_name: cls.short_name, rate_per_session: cls.rate_per_session, type: 'EXTRA' };
        }

        const classSchedules = (schedulesData || []).filter(s => s.class_id === cls.id);
        const days = classSchedules.map(s => daysOfWeekLabels[s.day_of_week]);
        
        return {
          id: cls.id,
          name: cls.name,
          short_name: cls.short_name,
          rate_per_session: cls.rate_per_session,
          type: 'FIXED',
          days: days,
          start_time: classSchedules[0]?.start_time?.slice(0, 5) || '18:00',
          end_time: classSchedules[0]?.end_time?.slice(0, 5) || '20:00',
          valid_from: classSchedules[0]?.valid_from
        };
      });

      setClasses(formattedClasses);
    } catch (err: any) {
      console.error(err);
      setError("Không thể tải danh sách lớp học.");
    }
  };

  useEffect(() => { fetchClasses(); }, []);

  const toggleDay = (dayIndex: number, isEdit: boolean) => {
    if (isEdit) {
      if (editSelectedDays.includes(dayIndex)) {
        setEditSelectedDays(editSelectedDays.filter(d => d !== dayIndex));
      } else {
        setEditSelectedDays([...editSelectedDays, dayIndex]);
      }
    } else {
      if (selectedDays.includes(dayIndex)) {
        setSelectedDays(selectedDays.filter(d => d !== dayIndex));
      } else {
        setSelectedDays([...selectedDays, dayIndex]);
      }
    }
  };

  const handleConfirmChangeSchedule = async (classId: number) => {
    if (editSelectedDays.length === 0) {
      alert("Vui lòng chọn ít nhất một thứ mới.");
      return;
    }
    setLoading(true); setError(null); setSuccess(null);
    try {
      const previousDate = new Date(editValidFrom);
      previousDate.setDate(previousDate.getDate() - 1);
      const validToValue = previousDate.toISOString().split('T')[0];

      const { error: closeError } = await supabase
        .from('class_schedules')
        .update({ valid_to: validToValue })
        .eq('class_id', classId)
        .is('valid_to', null);

      if (closeError) throw closeError;

      const newSchedules = editSelectedDays.map(day => ({
        class_id: classId, day_of_week: day, start_time: editStartTime, end_time: editEndTime, valid_from: editValidFrom, valid_to: null
      }));

      const { error: insertError } = await supabase.from('class_schedules').insert(newSchedules);
      if (insertError) throw insertError;

      setSuccess("Đổi lịch dạy thành công!");
      setChangingScheduleClassId(null);
      fetchClasses();
    } catch (err: any) {
      console.error(err); setError("Có lỗi xảy ra khi đổi lịch.");
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
      const { error } = await supabase.from('classes').delete().eq('id', classId);
      if (error) throw error;
      setSuccess("Xóa lớp thành công!");
      fetchClasses();
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
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
      const mockUserId = 'b66ddf15-f7bb-4db1-a016-9bea0f6587a4';
      const { data: newClass, error: classError } = await supabase
        .from('classes').insert({ user_id: mockUserId, name: name.trim(), short_name: short_name.trim().toUpperCase(), rate_per_session: Number(rate_per_session), type: classType }).select().single();

      if (classError) throw classError;

      if (classType === 'FIXED' && newClass) {
        const rowsToInsert = selectedDays.map((day) => ({ class_id: newClass.id, day_of_week: day, start_time: start_time, end_time: end_time, valid_from: valid_from, valid_to: null }));
        const { error: scheduleError } = await supabase.from('class_schedules').insert(rowsToInsert);
        if (scheduleError) throw scheduleError;
      }

      setSuccess("Tạo lớp thành công!");
      setName(''); setShort_Name(''); setRate_Per_Session(''); setSelectedDays([]);
      fetchClasses();
      setActiveTab('LIST'); // Tạo xong tự động nhảy về tab danh sách
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className={styles.Card}>
      {/* --- THANH CHUYỂN TAB PHÙ HỢP CHO ĐIỆN THOẠI --- */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', backgroundColor: 'var(--bg-input)', padding: '4px', borderRadius: '9999px' }}>
        <button 
          type="button" 
          onClick={() => { setActiveTab('LIST'); setError(null); setSuccess(null); }}
          className={activeTab === 'LIST' ? styles.dayBtnActive : styles.dayBtn}
          style={{ flex: 1, padding: '8px 0', margin: 0, fontSize: '0.85rem', borderRadius: '9999px', border: 'none' }}
        >
           Danh sách ({classes.length})
        </button>
        <button 
          type="button" 
          onClick={() => { setActiveTab('CREATE'); setError(null); setSuccess(null); }}
          className={activeTab === 'CREATE' ? styles.dayBtnActive : styles.dayBtn}
          style={{ flex: 1, padding: '8px 0', margin: 0, fontSize: '0.85rem', borderRadius: '9999px', border: 'none' }}
        >
          ➕ Tạo lớp mới
        </button>
      </div>

      {error && <p style={{ color: 'red', fontSize: '0.8rem', textAlign: 'center', marginBottom: '10px' }}>{error}</p>}
      {success && <p style={{ color: 'green', fontSize: '0.8rem', textAlign: 'center', marginBottom: '10px' }}>{success}</p>}

     {/* ================= TAB 1: DANH SÁCH LỚP ================= */}
{activeTab === 'LIST' && (
  <div className={styles.eventList} style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
    {classes.length === 0 && (
      <p style={{ textAlign: 'center', fontSize: '0.85rem', opacity: 0.5, marginTop: '20px' }}>
        Chưa có lớp học nào.
      </p>
    )}
    
    {classes.map((cls) => (
      <div key={cls.id} className={styles.eventCard}>
        
        {/* Phần đầu Card: Chứa Giờ học & Menu nút chức năng */}
        <div className={styles.cardTop}>
          <div className={styles.cardLeft}>
            {/* Chấm tròn phân biệt màu sắc giữa FIXED và EXTRA */}
            <span 
              className={styles.cardDot} 
              style={{ backgroundColor: cls.type === 'FIXED' ? 'var(--primary)' : '#7928ca' }}
            />
            <span className={styles.cardTime}>
              {cls.type === 'FIXED' ? (
                <>{cls.start_time} - {cls.end_time}</>
              ) : (
                <>Lịch linh hoạt</>
              )}
            </span>
          </div>

          {/* Cặp nút chức năng (Sửa/Xóa) thu gọn thay cho nút Menu ba chấm */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {cls.type === 'FIXED' && (
              <button 
                type="button" 
                title="Đổi lịch dạy" 
                onClick={() => handleOpenChangeScheduleForm(cls)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', padding: '2px' }}
              >
                🔄
              </button>
            )}
            <button 
              type="button" 
              title="Xóa lớp" 
              onClick={() => handleDeleteClick(cls.id)} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', padding: '2px' }}
              disabled={loading}
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Giữa Card: Tên lớp học & Mã lớp */}
        <h3 className={styles.cardTitle}>
          {cls.name} <span style={{ fontSize: '0.8rem', fontWeight: 500, opacity: 0.5 }}>({cls.short_name})</span>
        </h3>

        {/* Dưới cùng Card: Thông tin phụ như Thứ dạy, Ngày áp dụng hoặc Lương */}
        <p className={styles.cardSub}>
          {cls.type === 'FIXED' ? (
            <>Lịch: <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{cls.days?.join(', ')}</span> • Áp dụng từ {cls.valid_from?.split('-').reverse().join('/')}</>
          ) : (
            <>Thiết lập trực tiếp từng buổi dạy trên bộ Lịch Tháng</>
          )}
          <span style={{ display: 'block', marginTop: '4px', fontWeight: '700', color: 'var(--btn-main, var(--primary))' }}>
            Lương {cls.rate_per_session.toLocaleString()}đ/buổi
          </span>
        </p>

        {/* KHUNG ĐỔI LỊCH (Bung nở gọn gàng ngay bên trong Card khi bấm nút 🔄) */}
        {changingScheduleClassId === cls.id && (
          <div style={{ 
            marginTop: '12px', 
            padding: '14px', 
            backgroundColor: 'var(--bg-input, rgba(0,0,0,0.02))', 
            borderRadius: '14px', 
            border: '1px dashed var(--border)' 
          }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: '700', color: 'var(--primary)', fontSize: '0.8rem' }}>
              ⚙️ Đổi lịch dạy mới:
            </p>
            
            <div className={styles.fieldRow} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.7rem', display: 'block', marginBottom: '2px' }}>Bắt đầu</label>
                <input type="time" className={styles.fieldInput} style={{ padding: '6px 12px', fontSize: '0.8rem' }} value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.7rem', display: 'block', marginBottom: '2px' }}>Kết thúc</label>
                <input type="time" className={styles.fieldInput} style={{ padding: '6px 12px', fontSize: '0.8rem' }} value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} />
              </div>
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '0.7rem', display: 'block', marginBottom: '2px' }}>Áp dụng từ ngày</label>
              <input type="date" className={styles.fieldInput} style={{ padding: '6px 12px', fontSize: '0.8rem' }} value={editValidFrom} onChange={(e) => setEditValidFrom(e.target.value)} />
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <div className={styles.weekGrid} style={{ gap: '3px' }}>
                {daysOfWeekLabels.map((label, index) => (
                  <button 
                    key={index} 
                    type="button" 
                    onClick={() => toggleDay(index, true)} 
                    className={`${styles.dayBtn} ${editSelectedDays.includes(index) ? styles.dayBtnActive : ''}`} 
                    style={{ padding: '6px 0', fontSize: '0.7rem' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="button" onClick={() => handleConfirmChangeSchedule(cls.id)} disabled={loading} className={styles.buttonPrimary} style={{ flex: 2, margin: 0, padding: '8px 0', fontSize: '0.75rem', width: 'auto' }}>XÁC NHẬN</button>
              <button type="button" onClick={() => setChangingScheduleClassId(null)} className={styles.dayBtn} style={{ flex: 1, margin: 0, padding: '8px 0', fontSize: '0.75rem' }}>HỦY</button>
            </div>
          </div>
        )}

      </div>
    ))}
  </div>
)}

      {/* ================= TAB 2: FORM TẠO MỚI ================= */}
      {activeTab === 'CREATE' && (
        <form onSubmit={handleSubmit} style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto', paddingRight: '2px' }}>
          <div className={styles.fieldPanel} style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="button" className={classType === 'FIXED' ? styles.dayBtnActive : styles.dayBtn} style={{ flex: 1, padding: '8px', margin: 0, fontSize: '0.75rem' }} onClick={() => setClassType('FIXED')}>CỐ ĐỊNH</button>
              <button type="button" className={classType === 'EXTRA' ? styles.dayBtnActive : styles.dayBtn} style={{ flex: 1, padding: '8px', margin: 0, fontSize: '0.75rem', backgroundColor: classType === 'EXTRA' ? '#7928ca' : '', borderColor: classType === 'EXTRA' ? '#7928ca' : '' }} onClick={() => setClassType('EXTRA')}>⚡ EXTRA</button>
            </div>
          </div>

          <div className={styles.fieldPanel} style={{ marginBottom: '12px' }}>
            <label className={styles.fieldLabel} style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Tên lớp học</label>
            <input type="text" className={styles.fieldInput} style={{ padding: '10px 16px', fontSize: '0.85rem' }} placeholder="Tên lớp..." value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
          </div>

          <div className={styles.fieldPanel} style={{ marginBottom: '12px' }}>
            <label className={styles.fieldLabel} style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Mã / Viết tắt hiển thị</label>
            <input type="text" className={styles.fieldInput} style={{ padding: '10px 16px', fontSize: '0.85rem' }} placeholder="Ví dụ: T9CB1" value={short_name} onChange={(e) => setShort_Name(e.target.value)} disabled={loading} />
          </div>

          <div className={styles.fieldPanel} style={{ marginBottom: '12px' }}>
            <label className={styles.fieldLabel} style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Thù lao / buổi (VNĐ)</label>
            <input type="number" className={styles.fieldInput} style={{ padding: '10px 16px', fontSize: '0.85rem' }} placeholder="180000" value={rate_per_session} onChange={(e) => setRate_Per_Session(e.target.value)} disabled={loading} />
          </div>

          {classType === 'FIXED' && (
            <div>
              <div className={styles.fieldRow} style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}><label className={styles.fieldLabel} style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Giờ bắt đầu</label><input type="time" className={styles.fieldInput} style={{ padding: '10px 16px', fontSize: '0.85rem' }} value={start_time} onChange={(e) => setStart_Time(e.target.value)} /></div>
                <div style={{ flex: 1 }}><label className={styles.fieldLabel} style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Giờ kết thúc</label><input type="time" className={styles.fieldInput} style={{ padding: '10px 16px', fontSize: '0.85rem' }} value={end_time} onChange={(e) => setEnd_Time(e.target.value)} /></div>
              </div>
              <div className={styles.fieldPanel} style={{ marginBottom: '12px' }}><label className={styles.fieldLabel} style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Ngày bắt đầu áp dụng</label><input type="date" className={styles.fieldInput} style={{ padding: '10px 16px', fontSize: '0.85rem' }} value={valid_from} onChange={(e) => setValid_From(e.target.value)} /></div>
              <div className={styles.fieldPanel} style={{ marginBottom: '16px' }}>
                <label className={styles.fieldLabel} style={{ fontSize: '0.8rem', marginBottom: '6px' }}>Lịch dạy cố định</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                  {daysOfWeekLabels.map((label, index) => (
                    <button key={index} type="button" onClick={() => toggleDay(index, false)} className={`${styles.dayBtn} ${selectedDays.includes(index) ? styles.dayBtnActive : ''}`} style={{ padding: '8px 0', fontSize: '0.75rem' }}>{label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button type="submit" className={styles.buttonPrimary} disabled={loading} style={{ width: '100%', margin: '10px 0 0 0', padding: '12px 0', fontSize: '0.85rem', backgroundColor: classType === 'EXTRA' ? '#7928ca' : '' }}>
            {loading ? "ĐANG LƯU..." : classType === 'FIXED' ? "➕ KHỞI TẠO LỚP FIXED" : "➕ KHỞI TẠO LỚP EXTRA"}
          </button>
        </form>
      )}
    </div>
  );
}