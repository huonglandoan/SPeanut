// app/components/Guide.tsx
"use client";

import { useState, useEffect } from 'react';
import { X, HelpCircle } from 'lucide-react';
import profileStyles from '../styles/Profile.module.css';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveNav?: React.Dispatch<React.SetStateAction<number>>;
}

export function GuideModal({ isOpen, onClose, setActiveNav }: GuideModalProps) {
  const [activeTab, setActiveTab] = useState<'calendar' | 'sync' | 'salary'>('calendar');

  if (!isOpen) return null;

  return (
    <div className={profileStyles.modalOverlay} onClick={onClose}>
      <div className={profileStyles.modalContent} style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={profileStyles.closeBtn}
          onClick={onClose}
          title="Đóng"
        >
          <X size={18} />
        </button>

        <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-title, #1e293b)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🥜 Hướng dẫn sử dụng SPeanut
        </h3>

        {/* Tab Headers */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border, #e2e8f0)', marginBottom: '20px', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            style={{
              padding: '8px 12px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'calendar' ? '2px solid var(--primary, #735BF2)' : 'none',
              color: activeTab === 'calendar' ? 'var(--primary, #735BF2)' : 'var(--text-main, #64748b)',
              fontWeight: activeTab === 'calendar' ? 700 : 500,
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📅 Lịch dạy
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            style={{
              padding: '8px 12px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'sync' ? '2px solid var(--primary, #735BF2)' : 'none',
              color: activeTab === 'sync' ? 'var(--primary, #735BF2)' : 'var(--text-main, #64748b)',
              fontWeight: activeTab === 'sync' ? 700 : 500,
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Đồng bộ Google
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('salary')}
            style={{
              padding: '8px 12px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'salary' ? '2px solid var(--primary, #735BF2)' : 'none',
              color: activeTab === 'salary' ? 'var(--primary, #735BF2)' : 'var(--text-main, #64748b)',
              fontWeight: activeTab === 'salary' ? 700 : 500,
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            💵 Lớp & Lương
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-main, #64748b)', textAlign: 'left' }}>
          {activeTab === 'calendar' && (
            <div>
              <h4 style={{ color: 'var(--text-title, #1e293b)', fontWeight: 700, marginBottom: '8px' }}>1. Xem lịch hàng tháng</h4>
              <p style={{ marginBottom: '12px' }}>Giao diện Lịch sẽ hiển thị các buổi dạy học của bạn dưới dạng các chấm tròn màu sắc trên ô ngày tương ứng.</p>
              
              <h4 style={{ color: 'var(--text-title, #1e293b)', fontWeight: 700, marginBottom: '8px' }}>2. Ý nghĩa màu sắc của buổi học</h4>
              <ul style={{ paddingLeft: '20px', marginBottom: '12px', listStyleType: 'disc' }}>
                <li style={{ marginBottom: '4px' }}>🟢 <strong style={{ color: '#00B383' }}>Xanh lá</strong>: Lớp dạy cố định hoạt động bình thường.</li>
                <li style={{ marginBottom: '4px' }}>🟡 <strong style={{ color: '#FFB000' }}>Màu vàng</strong>: Buổi dạy phát sinh Extra (chỉ dạy một lần duy nhất).</li>
                <li style={{ marginBottom: '4px' }}>🔴 <strong style={{ color: '#FF3B30' }}>Màu đỏ</strong>: Buổi học được đánh dấu **Nghỉ/Hủy dạy**.</li>
              </ul>

              <h4 style={{ color: 'var(--text-title, #1e293b)', fontWeight: 700, marginBottom: '8px' }}>3. Báo nghỉ dạy (Hủy buổi)</h4>
              <p>Để đánh dấu nghỉ học vào một ngày cụ thể, hãy chọn ngày đó trên lịch ➜ Nhìn sang danh sách buổi dạy ở cột bên phải ➜ **Nhấp vào thẻ buổi dạy đó**. Giao diện sẽ đổi sang màu đỏ và chèn thêm chữ `[Nghỉ]` đằng trước.</p>
            </div>
          )}

          {activeTab === 'sync' && (
            <div>
              <h4 style={{ color: 'var(--text-title, #1e293b)', fontWeight: 700, marginBottom: '8px' }}>1. Yêu cầu cấu hình</h4>
              <p style={{ marginBottom: '12px' }}>Đồng bộ Google Calendar yêu cầu cấu hình **Google Client ID**. Nếu chưa được thiết lập, vui lòng truy cập trang `/deploy` để cấu hình thông số.</p>

              <h4 style={{ color: 'var(--text-title, #1e293b)', fontWeight: 700, marginBottom: '8px' }}>2. Cách thực hiện đồng bộ</h4>
              <p style={{ marginBottom: '12px' }}>Bấm nút **Đồng bộ Google** ở góc trên cùng bên trái màn hình Lịch dạy. Đăng nhập tài khoản Google của bạn và cấp quyền truy cập lịch khi được yêu cầu.</p>

              <h4 style={{ color: 'var(--text-title, #1e293b)', fontWeight: 700, marginBottom: '8px' }}>3. Cơ chế hoạt động</h4>
              <p>Hệ thống tự động dọn sạch các sự kiện cũ mang nhãn hiệu `[SPeanut]` của tháng đó trên Google Calendar, sau đó tạo mới đè lên với tiêu đề và màu sắc tương ứng (Xanh cho cố định, Vàng cho Extra, Đỏ cho ngày Nghỉ).</p>
            </div>
          )}

          {activeTab === 'salary' && (
            <div>
              <h4 style={{ color: 'var(--text-title, #1e293b)', fontWeight: 700, marginBottom: '8px' }}>1. Quản lý lớp học</h4>
              <p style={{ marginBottom: '12px' }}>Bạn có thể tạo lớp học cố định hoặc lớp Extra tại trang **Lớp học**. Mỗi lớp học sẽ có thù lao (tiền lương) riêng tính trên mỗi buổi dạy.</p>

              <h4 style={{ color: 'var(--text-title, #1e293b)', fontWeight: 700, marginBottom: '8px' }}>2. Cơ chế tính lương hàng tháng</h4>
              <p style={{ marginBottom: '12px' }}>Lương thực tế hàng tháng = **(Tổng số buổi dạy đã thực hiện x Thù lao/buổi) + Thu nhập phụ thêm (Extra Incomes)**. Những buổi đã báo Nghỉ (màu đỏ) sẽ không được tính tiền lương.</p>

              <h4 style={{ color: 'var(--text-title, #1e293b)', fontWeight: 700, marginBottom: '8px' }}>3. Thu nhập phụ thêm (Extra Incomes)</h4>
              <p>Bạn có thể thêm các khoản thu nhập phụ (tiền thưởng, làm thêm việc khác...) bằng cách nhấp nút cộng trong bảng Lương ở trang Lương.</p>
            </div>
          )}
        </div>

        {activeTab === 'calendar' ? (
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', width: '100%' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: 'transparent',
                color: 'var(--text-main, #64748b)',
                border: '1.5px solid var(--border, #e2e8f0)',
                borderRadius: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('speanut_active_tour', 'true');
                localStorage.setItem('speanut_tour_step', '1');
                onClose();
                if (setActiveNav) {
                  setActiveNav(1);
                }
              }}
              style={{
                flex: 1.5,
                padding: '12px',
                backgroundColor: 'var(--primary, #735BF2)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(115, 91, 242, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '14px'
              }}
            >
              Bắt đầu Tour 🚀
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: 'var(--primary, #735BF2)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: '24px',
              boxShadow: '0 4px 12px rgba(115, 91, 242, 0.15)',
              fontSize: '14px'
            }}
          >
            Đã hiểu!
          </button>
        )}
      </div>
    </div>
  );
}

interface InteractiveTourProps {
  activeNav: number;
}

export function InteractiveTour({ activeNav }: InteractiveTourProps) {
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(1);

  useEffect(() => {
    if (activeNav === 1 && typeof window !== 'undefined') {
      const activeTour = localStorage.getItem('speanut_active_tour') === 'true';
      if (activeTour) {
        setIsTourActive(true);
        const step = parseInt(localStorage.getItem('speanut_tour_step') || '1', 10);
        setTourStep(step);
      }
    } else {
      setIsTourActive(false);
    }
  }, [activeNav]);

  const handleNextTourStep = () => {
    const nextStep = tourStep + 1;
    if (nextStep > 3) {
      setIsTourActive(false);
      localStorage.removeItem('speanut_active_tour');
      localStorage.removeItem('speanut_tour_step');
    } else {
      setTourStep(nextStep);
      localStorage.setItem('speanut_tour_step', String(nextStep));
    }
  };

  const handleSkipTour = () => {
    setIsTourActive(false);
    localStorage.removeItem('speanut_active_tour');
    localStorage.removeItem('speanut_tour_step');
  };

  if (!isTourActive) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(1px)',
      zIndex: 9999,
      pointerEvents: 'auto'
    }}>
      {tourStep === 1 && (
        <div style={{
          position: 'absolute',
          top: '55%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '320px',
          backgroundColor: 'var(--bg-card, #fff)',
          border: '2.5px solid var(--primary, #735BF2)',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 10px 30px rgba(115, 91, 242, 0.25)',
          textAlign: 'left',
          animation: 'slideUp 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary, #735BF2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bước 1/3: Lịch dạy học</span>
            <button type="button" onClick={handleSkipTour} style={{ background: 'none', border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Bỏ qua</button>
          </div>
          <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-title, #1e293b)', marginBottom: '8px' }}>📅 Theo dõi lịch hàng tháng</h4>
          <p style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-main, #64748b)', marginBottom: '16px' }}>
            Các chấm tròn màu sắc trên lịch thể hiện trạng thái buổi dạy:<br/>
            🟢 Lớp cố định | 🟡 Lớp Extra | 🔴 Buổi học nghỉ.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleNextTourStep}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--primary, #735BF2)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Tiếp theo ➜
            </button>
          </div>
        </div>
      )}

      {tourStep === 2 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '20px',
          transform: 'translateY(-50%)',
          width: '320px',
          backgroundColor: 'var(--bg-card, #fff)',
          border: '2.5px solid var(--primary, #735BF2)',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 10px 30px rgba(115, 91, 242, 0.25)',
          textAlign: 'left',
          animation: 'slideUp 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary, #735BF2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bước 2/3: Báo nghỉ dạy</span>
            <button type="button" onClick={handleSkipTour} style={{ background: 'none', border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Bỏ qua</button>
          </div>
          <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-title, #1e293b)', marginBottom: '8px' }}>🔴 Báo nghỉ / Hủy buổi dạy</h4>
          <p style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-main, #64748b)', marginBottom: '16px' }}>
            Chọn một ngày trên lịch, sau đó **nhấp trực tiếp vào thẻ buổi học** ở cột bên phải này để báo nghỉ học. Thẻ sẽ chuyển màu đỏ và tự động trừ tiền lương của buổi đó.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleNextTourStep}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--primary, #735BF2)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Tiếp theo ➜
            </button>
          </div>
        </div>
      )}

      {tourStep === 3 && (
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '20px',
          width: '320px',
          backgroundColor: 'var(--bg-card, #fff)',
          border: '2.5px solid var(--primary, #735BF2)',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 10px 30px rgba(115, 91, 242, 0.25)',
          textAlign: 'left',
          animation: 'slideUp 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary, #735BF2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bước 3/3: Đồng bộ Google</span>
            <button type="button" onClick={handleSkipTour} style={{ background: 'none', border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Bỏ qua</button>
          </div>
          <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-title, #1e293b)', marginBottom: '8px' }}>🔄 Đồng bộ Google Calendar</h4>
          <p style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-main, #64748b)', marginBottom: '16px' }}>
            Bấm nút **Đồng bộ Google** ở đây để chuyển toàn bộ lịch dạy và lịch nghỉ của tháng sang ứng dụng lịch của Google để nhận thông báo hàng ngày!
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleNextTourStep}
              style={{
                padding: '8px 16px',
                backgroundColor: '#00B383',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Hoàn thành 🎉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
