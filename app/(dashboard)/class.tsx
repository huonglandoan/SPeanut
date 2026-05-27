'use client'
import React, { useState } from 'react';
import styles from  '../styles/Class.module.css'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LoginWithAPI } from '../services/auth'
import Link from 'next/link'

export default function FixedClassForm() {
  const [name, setName] = useState('')
  const [short_name, setShort_Name] = useState('')
  const [start_time, setStart_Time] = useState('18:00') 
  const [end_time, setEnd_Time] = useState('20:00')
  const [rate_per_session, setRate_Per_Session] = useState('')
  const [valid_from, setValid_From] = useState('');
  const [valid_to, setValid_To] = useState(''); 
  const router = useRouter(); 
  const [classes, setClasses] = useState<any[]>([]);

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

const fetchClasses = async () => {
  try {
    const { data, error: supabaseError } = await supabase
      .from('class_schedules') 
      .select('*')
      .order('day_of_week', { ascending: true }); 

    if (supabaseError) throw supabaseError;
    if (data) setClasses(data);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách lớp:", err);
  }
};

React.useEffect(() => {
  fetchClasses();
}, []);
  const daysOfWeekLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const toggleDay = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter(d => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex]);
    }
  };
  const handleDeleteClick = async (classId: number) => {
  const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa lớp học này không? Tất cả lịch liên quan sẽ bị ảnh hưởng.");
  if (!confirmDelete) return;

  setLoading(true);
  setError(null);
  setSuccess(null);

  try {
    const { error: supabaseError } = await supabase
      .from('class_schedules') 
      .delete()
      .eq('id', classId);

    if (supabaseError) throw supabaseError;

    setSuccess("Xóa lớp học thành công!");
    setTimeout(() => {
      router.refresh();
    }, 1000);

  } catch (err: any) {
    console.error("Lỗi khi xóa lớp:", err);
    setError(err.message || "Không thể xóa lớp học. Vui lòng thử lại.");
  } finally {
    setLoading(false);
  }
};
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      setSuccess(null);

      if (!name.trim() || !short_name.trim() || !rate_per_session) {
      setError("Vui lòng điền đầy đủ tên lớp, mã viết tắt và giá tiền.");
      return;
    }

      if (selectedDays.length === 0) {
        setError("Vui lòng chọn ít nhất một thứ trong tuần.");
        return;
    }

      setLoading(true);
      try {
      const rowsToInsert = selectedDays.map((day) => ({
        name: name.trim(),
        short_name: short_name.trim().toUpperCase(),
        day_of_week: day,
        start_time: start_time,
        end_time: end_time,
        rate_per_session: Number(rate_per_session)
      }));

      const { error: supabaseError } = await supabase
        .from('class_schedules') 
        .insert(rowsToInsert);

      if (supabaseError) throw supabaseError;

      setSuccess("Thêm lớp mới thành công!");
      setName('');
      setShort_Name('');
      setStart_Time('18:00');
      setEnd_Time('20:00');
      setRate_Per_Session('');
      setSelectedDays([]);

      setTimeout(() => {
        router.refresh(); 
      }, 1500);

    } catch (err: any) {
      console.error("Lỗi:", err);
      setError(err.message || "Đã xảy ra lỗi khi lưu dữ liệu.");
    } finally {
      setLoading(false);
    }
    }; 
    const handleEditClick = (cls: any) => {
  
  setName(cls.name);
  setShort_Name(cls.short_name);
  setStart_Time(cls.start_time);
  setEnd_Time(cls.end_time);
  setRate_Per_Session(cls.rate_per_session.toString());
  setSelectedDays([cls.day_of_week]); 
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
};
  return (
    <div className={styles.Card}>
      <p className={styles.Title}>Class</p>
<div className={styles.classList}>
  {/* Thay availableClasses.map thành classes.map */}
  {classes.map((cls) => (
    <div key={cls.id} className={styles.classItemCard}>
      
      {/* Bên trái: Tên lớp & Giờ giấc & Thứ */}
      <div className={styles.classMeta}>
        <h3 className={styles.classNameText}>
          {cls.name} <span style={{ fontSize: '0.8rem', fontWeight: 500, opacity: 0.6 }}>({cls.short_name})</span>
        </h3>
        <span className={styles.classSubText}>
          🕒 {cls.start_time} - {cls.end_time} • Thứ {cls.day_of_week === 0 ? 'CN' : cls.day_of_week + 1}
        </span>
      </div>

      {/* Bên phải: Tiền thù lao & Nút Sửa / Xóa */}
      <div className={styles.classRightSide}>
        <div className={styles.actionButtons}>
          <button 
            type="button" 
            title="Sửa lớp"
            onClick={() => handleEditClick(cls)} 
            className={styles.miniActionBtn}
          >
            ✏️
          </button>
          <button 
            type="button" 
            title="Xóa lớp"
            onClick={() => handleDeleteClick(cls.id)} 
            className={styles.miniActionBtn}
          >
            🗑️
          </button>
        </div>
      </div>

    </div>
  ))}
</div>

        <form onSubmit={handleSubmit}>
          {/* Tên Lớp */}
        <div className={styles.fieldPanel}>
          <label className={styles.fieldLabel}>Tên lớp học</label>
          <input 
            type="text"
            className={styles.fieldInput}
            placeholder="Toán 9 cơ bản 2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </div>
        {/* Mã Viết Tắt */}
        <div className={styles.fieldPanel}>
          <label className={styles.fieldLabel}>Mã / Viết tắt</label>
          <input 
            type="text"
            className={styles.fieldInput}
            placeholder="T9CB2"
            value={short_name}
            onChange={(e) => setShort_Name(e.target.value)}
            disabled={loading}
          />
        </div>
        {/* Khung Giờ Học */}
        <div className={styles.fieldRow} style={{ display: 'flex', gap: '16px', marginBottom: '22px' }}>
          <div className={styles.fieldPanel} style={{ flex: 1, marginBottom: 0 }}>
            <label className={styles.fieldLabel}>Giờ bắt đầu</label>
            <input 
              type="time"
              className={styles.fieldInput}
              value={start_time}
              onChange={(e) => setStart_Time(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className={styles.fieldPanel} style={{ flex: 1, marginBottom: 0 }}>
            <label className={styles.fieldLabel}>Giờ kết thúc</label>
            <input 
              type="time"
              className={styles.fieldInput}
              value={end_time}
              onChange={(e) => setEnd_Time(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        {/* Ô NHẬP GIÁ TIỀN MỖI BUỔI */}
        <div className={styles.fieldPanel}>
          <label className={styles.fieldLabel}>Giá tiền 1 buổi (VNĐ)</label>
          <input 
            type="number"
            className={styles.fieldInput}
            placeholder="200000"
            value={rate_per_session}
            onChange={(e) => setRate_Per_Session(e.target.value)}
            disabled={loading}
          />
        </div>
       {/* Khoảng thời gian hiệu lực của lớp */}
        <div className={styles.fieldRow} style={{ display: 'flex', gap: '16px', marginBottom: '22px' }}>
          <div className={styles.fieldPanel} style={{ flex: 1, marginBottom: 0 }}>
            <label className={styles.fieldLabel}>Bắt đầu</label>
            <input 
              type="date"
              className={styles.fieldInput}
              value={valid_from}
              onChange={(e) => setValid_From(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className={styles.fieldPanel} style={{ flex: 1, marginBottom: 0 }}>
            <label className={styles.fieldLabel}>Kết thúc</label>
            <input 
              type="date"
              className={styles.fieldInput}
              placeholder="Để trống nếu dạy lâu dài"
              value={valid_to}
              onChange={(e) => setValid_To(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        {/* Chọn các thứ trong tuần */}
        <div className={styles.fieldPanel}>
          <label className={styles.fieldLabel}>Lịch dạy cố định (Tích chọn thứ)</label>
          <div className={styles.weekGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {daysOfWeekLabels.map((label, index) => {
              const isSelected = selectedDays.includes(index);
              return (
                <button
                  key={index}
                  type="button"
                  disabled={loading}
                  onClick={() => toggleDay(index)}
                  className={`${styles.dayBtn} ${isSelected ? styles.dayBtnActive : ''}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <button 
          type="submit" 
          className={styles.buttonPrimary}
          disabled={loading}
        >
          {loading ? "ĐANG LƯU..." : "THÊM LỚP MỚI"}
        </button>
        </form>
        
      </div>
      
  );
}
