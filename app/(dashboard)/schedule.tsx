'use client'
import { useState } from 'react'
import schedStyles from '../styles/Schedule.module.css' // Import file CSS riêng biệt

// 1. ĐỊNH NGHĨA SẴN KIỂU DỮ LIỆU ĐỂ MANAGEMENT LỚP HỌC
interface ClassSchedule {
  id?: number;
  name: string;
  short_name: string;
  day_of_week: number; // 0: CN, 1: T2, ..., 6: T7 (Khớp hoàn toàn với Database)
  start_time: string;
  end_time: string;
  rate_per_session: number;
}

export default function Scheduler() {
  // State quản lý việc người dùng đang muốn thêm lớp cố định hay lớp Extra
  const [isExtraFlow, setIsExtraFlow] = useState<boolean>(false);

  return (
    <div className={schedStyles.schedulerContent}>
      {/* ======================================================== */}
      {/* PHẦN 1: TAB ĐỔI LUỒNG CẤU HÌNH (CỐ ĐỊNH VS EXTRA) */}
      {/* ======================================================== */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setIsExtraFlow(false)}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: '600',
            cursor: 'pointer',
            backgroundColor: !isExtraFlow ? '#4f46e5' : '#f5f5f5',
            color: !isExtraFlow ? '#fff' : '#666',
            transition: 'all 0.2s'
          }}
        >
          📅 Lịch Cố Định
        </button>
        <button
          type="button"
          onClick={() => setIsExtraFlow(true)}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: '600',
            cursor: 'pointer',
            backgroundColor: isExtraFlow ? '#4f46e5' : '#f5f5f5',
            color: isExtraFlow ? '#fff' : '#666',
            transition: 'all 0.2s'
          }}
        >
          ⚡ Buổi Dạy Phát Sinh (Extra)
        </button>
      </div>

      {/* ======================================================== */}
      {/* PHẦN 2: KHU VỰC CHỨA FORM XỬ LÝ THEO ĐIỀU KIỆN */}
      {/* ======================================================== */}
      {!isExtraFlow ? (
        /* LUỒNG CẤU HÌNH LỊCH CỐ ĐỊNH (Tương ứng bảng classes + class_schedules) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className={schedStyles.contentBox}>
            <p style={{ margin: 0, fontWeight: '600', color: '#333' }}>
              Form Tạo Lớp & Chọn Lịch Trình Lặp Lại
            </p>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
              (Hệ thống sẽ tự động điền giờ cố định vào lịch dạy hàng tuần của bạn)
            </p>
          </div>
          
          {/* Demo khung nhập liệu sơ bộ */}
          <input type="text" placeholder="Ví dụ: Toán 10 Nâng Cao" style={inputStyle} />
          <input type="text" placeholder="Tên viết tắt (T10NC)" style={inputStyle} />
          <input type="number" placeholder="Học phí/buổi (Ví dụ: 180000)" style={inputStyle} />
        </div>
      ) : (
        /* LUỒNG CẤU HÌNH LỚP TĂNG CƯỜNG / PHÁT SINH (Tương ứng chèn thẳng vào teaching_logs với status='EXTRA') */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className={schedStyles.contentBox} style={{ borderColor: '#f59e0b' }}>
            <p style={{ margin: 0, fontWeight: '600', color: '#d97706' }}>
              Form Điểm Danh Buổi Dạy Tăng Cường
            </p>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
              (Sử dụng khi dạy bù, dạy thêm giờ ngoài lịch cố định ban đầu)
            </p>
          </div>

          {/* Demo khung nhập liệu sơ bộ */}
          <input type="date" style={inputStyle} defaultValue="2026-05-26" />
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="time" placeholder="Bắt đầu" style={{ ...inputStyle, flex: 1 }} />
            <input type="time" placeholder="Kết thúc" style={{ ...inputStyle, flex: 1 }} />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PHẦN 3: NÚT ACTION LƯU DỮ LIỆU XUỐNG SUPABASE */}
      {/* ======================================================== */}
      <button
        type="button"
        style={{
          width: '100%',
          backgroundColor: '#10b981',
          color: '#fff',
          border: 'none',
          padding: '12px',
          borderRadius: '10px',
          fontWeight: 'bold',
          fontSize: '16px',
          marginTop: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
        }}
        onClick={() => alert('Chức năng kết nối Supabase API sắp hoàn thiện!')}
      >
        💾 Lưu Thông Tin Vào Hệ Thống
      </button>
    </div>
  );
}

// Style inline bổ trợ nhanh cho các ô Input
const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #e0e0e0',
  fontSize: '14px',
  outline: 'none',
  backgroundColor: '#fafafa'
};