// app/components/Guide.tsx
"use client";

import { useState, useEffect } from 'react';
import { X, Calendar, BookOpen, User, RefreshCw, Sparkles } from 'lucide-react';
import { Quicksand } from 'next/font/google';
import profileStyles from '../styles/Profile.module.css';

const quicksand = Quicksand({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
});

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveNav?: React.Dispatch<React.SetStateAction<number>>;
}

export function GuideModal({ isOpen, onClose, setActiveNav }: GuideModalProps) {
  const [activeTab, setActiveTab] = useState<'calendar' | 'class' | 'profile'>('calendar');

  if (!isOpen) return null;

  const tabStyle = (tab: string): React.CSSProperties => ({
    padding: '8px 14px',
    border: 'none',
    background: 'none',
    borderBottom: activeTab === tab ? '2px solid var(--primary, #735BF2)' : '2px solid transparent',
    color: activeTab === tab ? 'var(--primary, #735BF2)' : 'var(--text-main, #64748b)',
    fontWeight: activeTab === tab ? 700 : 500,
    cursor: 'pointer',
    fontSize: '14px',
    whiteSpace: 'nowrap' as const,
  });

  const gifBoxStyle: React.CSSProperties = {
    marginBottom: '24px',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid var(--border, #e2e8f0)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  };

  return (
    <div className={profileStyles.modalOverlay} onClick={onClose}>
      <div
        className={profileStyles.modalContent}
        style={{ maxWidth: '700px', fontFamily: `ui-rounded, ${quicksand.style.fontFamily}, sans-serif` }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={profileStyles.closeBtn}
          onClick={onClose}
          title="Đóng"
        >
          <X size={18} />
        </button>

        <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-title, #1e293b)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Hướng dẫn sử dụng
        </h3>

        {/* Tab Headers */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border, #e2e8f0)',
          marginBottom: '24px',
          gap: '4px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}>
          <button type="button" onClick={() => setActiveTab('calendar')} style={tabStyle('calendar')}>
            Lịch dạy
          </button>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem('speanut_active_class_tour', 'true');
              localStorage.setItem('speanut_class_tour_step', '1');
              if (setActiveNav) setActiveNav(0);
              window.dispatchEvent(new Event('speanut_start_class_tour'));
              onClose();
            }}
            style={tabStyle('class')}
          >
            Quản lý lớp
          </button>
          <button type="button" onClick={() => setActiveTab('profile')} style={tabStyle('profile')}>
            Cá nhân
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-main, #64748b)' }}>

          {/* ── Lịch dạy ── */}
          {activeTab === 'calendar' && (
            <div>
              <h4 style={{ color: 'var(--text-title, #1e293b)', fontWeight: 700, marginBottom: '8px' }}>1. Đánh dấu nghỉ dạy</h4>
              <p style={{ marginBottom: '12px' }}>
                Chọn ngày trên lịch → nhấp vào thẻ buổi học bên phải. Thẻ đổi đỏ, chèn <strong>[Nghỉ]</strong> và tự trừ khỏi lương tháng.
              </p>
              <div style={gifBoxStyle}>
                <img src="/Danh dau nghi.gif" alt="Đánh dấu nghỉ dạy" style={{ width: '100%', display: 'block' }} />
              </div>

              <h4 style={{ color: 'var(--text-title, #1e293b)', fontWeight: 700, marginBottom: '8px' }}>2. Đồng bộ Google Calendar</h4>
              <p style={{ marginBottom: '12px' }}>
                Bấm <strong>Đồng bộ Google</strong> ở góc trên trái → đăng nhập Google → lịch dạy và ngày nghỉ được đẩy sang Google Calendar.
              </p>
              <div style={gifBoxStyle}>
                <img src="/GG calendar.gif" alt="Đồng bộ Google Calendar" style={{ width: '100%', display: 'block' }} />
              </div>
            </div>
          )}

          {/* ── Quản lý lớp ── */}
          {activeTab === 'class' && (
            <div>
              <h4 style={{ color: 'var(--text-title, #1e293b)', fontWeight: 700, marginBottom: '8px' }}>1. Tổng quan quản lý lớp</h4>
              <p style={{ marginBottom: '12px' }}>
                Trang <strong>Lớp học</strong> liệt kê toàn bộ lớp cố định (hàng tuần) và lớp Extra (phát sinh lẻ) cùng thù lao từng buổi.
              </p>
              <div style={gifBoxStyle}>
                <img src="/Quan ly lich day.gif" alt="Quản lý lớp học" style={{ width: '100%', display: 'block' }} />
              </div>

              <h4 style={{ color: 'var(--text-title, #1e293b)', fontWeight: 700, marginBottom: '8px' }}>2. Tạo lớp cố định</h4>
              <p style={{ marginBottom: '12px' }}>
                Nhấn <strong>+ Thêm lớp</strong> → Lớp cố định → điền tên, ngày trong tuần, giờ học, thù lao. Lớp tự xuất hiện trên lịch hàng tuần.
              </p>
              <div style={gifBoxStyle}>
                <img src="/Tao lop co dinh.gif" alt="Tạo lớp cố định" style={{ width: '100%', display: 'block' }} />
              </div>

              <h4 style={{ color: 'var(--text-title, #1e293b)', fontWeight: 700, marginBottom: '8px' }}>3. Tạo buổi Extra & xem chi tiết</h4>
              <p style={{ marginBottom: '12px' }}>
                Buổi phát sinh lẻ → chọn Lớp Extra và đặt ngày cụ thể. Xem lịch, thù lao và tiến độ từng lớp chi tiết.
              </p>
              <div style={gifBoxStyle}>
                <img src="/Tao lop extra.gif" alt="Tạo lớp Extra" style={{ width: '100%', display: 'block' }} />
              </div>
            </div>
          )}

          {/* ── Cá nhân ── */}
          {activeTab === 'profile' && (
            <div>
              <h4 style={{ color: 'var(--text-title, #1e293b)', fontWeight: 700, marginBottom: '8px' }}>1. Cập nhật thông tin cá nhân</h4>
              <p style={{ marginBottom: '12px' }}>
                Chỉnh sửa tên, ảnh đại diện và tải QR ngân hàng — hệ thống tự nhận diện số tài khoản, ngân hàng và chủ tài khoản.
              </p>
              <div style={gifBoxStyle}>
                <img src="/Thong tin ca nha.gif" alt="Thông tin cá nhân" style={{ width: '100%', display: 'block' }} />
              </div>

              <h4 style={{ color: 'var(--text-title, #1e293b)', fontWeight: 700, marginBottom: '8px' }}>2. Giao diện Sáng / Tối</h4>
              <p style={{ marginBottom: '12px' }}>
                SPeanut hỗ trợ Dark Mode. Nhấp ☀️ / 🌙 ở góc trên màn hình để đổi giao diện ngay.
              </p>
              <div style={gifBoxStyle}>
                <img src="/dark-light.gif" alt="Giao diện Sáng Tối" style={{ width: '100%', display: 'block' }} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'calendar' ? (
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '12px',
                backgroundColor: 'transparent',
                color: 'var(--text-main, #64748b)',
                border: '1.5px solid var(--border, #e2e8f0)',
                borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '14px'
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
                if (setActiveNav) setActiveNav(1);
              }}
              style={{
                flex: 1.5, padding: '12px',
                backgroundColor: 'var(--primary, #735BF2)', color: '#fff',
                border: 'none', borderRadius: '12px', fontWeight: 700,
                cursor: 'pointer', fontSize: '14px',
                boxShadow: '0 4px 12px rgba(115,91,242,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>Bắt đầu tour</span>
              <img
                src="/peanut.png"
                alt="peanut"
                style={{
                  width: '18px',
                  height: '18px',
                  objectFit: 'contain'
                }}
              />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%', marginTop: '24px', padding: '12px',
              backgroundColor: 'var(--primary, #735BF2)', color: '#fff',
              border: 'none', borderRadius: '12px', fontWeight: 700,
              cursor: 'pointer', fontSize: '14px',
              boxShadow: '0 4px 12px rgba(115,91,242,0.2)',
            }}
          >
            Đã hiểu!
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── Interactive Tour ─────────────────────────── */

interface InteractiveTourProps {
  activeNav: number;
  setActiveNav?: React.Dispatch<React.SetStateAction<number>>;
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
    if (nextStep > 5) {
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

  const TOUR_STEPS = [
    {
      label: 'Bước 1/5: Lịch dạy học',
      title: (
        <>
          <Calendar size={18} style={{ color: 'var(--primary, #735BF2)' }} />
          <span>Theo dõi lịch hàng tháng</span>
        </>
      ),
      desc: (
        <span>
          Các chấm tròn màu thể hiện trạng thái buổi dạy:<br />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginRight: '12px', marginTop: '6px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00B383' }} /> Lớp cố định
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginRight: '12px', marginTop: '6px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FFB000' }} /> Lớp Extra
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FF3B30' }} /> Buổi nghỉ
          </span>
        </span>
      ),
      gif: '/Quan ly lich day.gif',
      pos: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' } as React.CSSProperties,
    },
    {
      label: 'Bước 2/5: Báo nghỉ dạy',
      title: (
        <>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#FF3B30' }} />
          <span>Báo nghỉ / Hủy buổi dạy</span>
        </>
      ),
      desc: 'Chọn ngày trên lịch → nhấp vào thẻ buổi học bên phải để báo nghỉ. Thẻ đổi đỏ và tự trừ tiền lương.',
      gif: '/Danh dau nghi.gif',
      pos: { top: '50%', right: '20px', transform: 'translateY(-50%)' } as React.CSSProperties,
    },
    {
      label: 'Bước 3/5: Đồng bộ Google',
      title: (
        <>
          <RefreshCw size={18} style={{ color: 'var(--primary, #735BF2)' }} />
          <span>Đồng bộ Google Calendar</span>
        </>
      ),
      desc: 'Bấm Đồng bộ Google ở góc trên trái để đẩy toàn bộ lịch dạy và ngày nghỉ sang Google Calendar.',
      gif: '/GG calendar.gif',
      pos: { top: '80px', left: '20px' } as React.CSSProperties,
    },
    {
      label: 'Bước 4/5: Lớp & Lương',
      title: (
        <>
          <BookOpen size={18} style={{ color: 'var(--primary, #735BF2)' }} />
          <span>Quản lý lớp & Tính lương</span>
        </>
      ),
      desc: 'Tạo lớp cố định hoặc Extra tại trang Lớp học. Lương tự tính theo số buổi dạy thực tế.',
      gif: '/Tao lop co dinh.gif',
      pos: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' } as React.CSSProperties,
    },
    {
      label: 'Bước 5/5: Cá nhân & Giao diện',
      title: (
        <>
          <User size={18} style={{ color: 'var(--primary, #735BF2)' }} />
          <span>Cá nhân & Giao diện tối</span>
        </>
      ),
      desc: 'Cập nhật thông tin cá nhân, QR chuyển khoản và chuyển đổi giao diện Sáng/Tối.',
      gif: '/Thong tin ca nha.gif',
      pos: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' } as React.CSSProperties,
    },
  ];

  const current = TOUR_STEPS[tourStep - 1];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(1px)',
      zIndex: 9999, pointerEvents: 'auto',
    }}>
      <style>{`
        .tour-popup {
          position: absolute;
          width: calc(100% - 32px);
          max-width: 380px;
          background-color: var(--bg-card, #fff);
          border: 2.5px solid var(--primary, #735BF2);
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 10px 30px rgba(115,91,242,0.25);
          text-align: left;
          z-index: 10000;
        }
        @media (max-width: 768px) {
          .tour-popup {
            left: 50% !important; right: auto !important;
            top: 50% !important; transform: translate(-50%, -50%) !important;
          }
        }
      `}</style>

      <div className="tour-popup" style={{ ...current.pos, fontFamily: `ui-rounded, ${quicksand.style.fontFamily}, sans-serif` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary, #735BF2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {current.label}
          </span>
          <button type="button" onClick={handleSkipTour} style={{ background: 'none', border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
            Bỏ qua
          </button>
        </div>

        <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-title, #1e293b)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {current.title}
        </h4>
        <p style={{ fontSize: '13px', lineHeight: '1.55', color: 'var(--text-main, #64748b)', marginBottom: '12px', whiteSpace: 'pre-line' }}>
          {current.desc}
        </p>

        <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border, #e2e8f0)', marginBottom: '16px' }}>
          <img src={current.gif} alt={current.title} style={{ width: '100%', display: 'block' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleNextTourStep}
            style={{
              padding: '8px 16px',
              backgroundColor: tourStep === 5 ? '#00B383' : 'var(--primary, #735BF2)',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontWeight: 700, cursor: 'pointer', fontSize: '13px',
            }}
          >
            {tourStep === 5 ? 'Hoàn thành 🎉' : 'Tiếp theo ➜'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Class Tour (3 steps) ─────────────────────────── */

export function ClassTour({ activeNav }: { activeNav: number }) {
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(1);

  useEffect(() => {
    const checkAndStartTour = () => {
      if (activeNav === 0 && typeof window !== 'undefined') {
        const activeTour = localStorage.getItem('speanut_active_class_tour') === 'true';
        if (activeTour) {
          setIsTourActive(true);
          const step = parseInt(localStorage.getItem('speanut_class_tour_step') || '1', 10);
          setTourStep(step);
        }
      } else {
        setIsTourActive(false);
      }
    };

    checkAndStartTour();

    window.addEventListener('speanut_start_class_tour', checkAndStartTour);
    return () => {
      window.removeEventListener('speanut_start_class_tour', checkAndStartTour);
    };
  }, [activeNav]);

  const handleNextTourStep = () => {
    const nextStep = tourStep + 1;
    if (nextStep > 3) {
      setIsTourActive(false);
      localStorage.removeItem('speanut_active_class_tour');
      localStorage.removeItem('speanut_class_tour_step');
    } else {
      setTourStep(nextStep);
      localStorage.setItem('speanut_class_tour_step', String(nextStep));
    }
  };

  const handleSkipTour = () => {
    setIsTourActive(false);
    localStorage.removeItem('speanut_active_class_tour');
    localStorage.removeItem('speanut_class_tour_step');
  };

  if (!isTourActive) return null;

  const TOUR_STEPS = [
    {
      label: 'Bước 1/3: Xem danh sách lớp',
      title: (
        <>
          <BookOpen size={18} style={{ color: 'var(--primary, #735BF2)' }} />
          <span>Xem danh sách lớp</span>
        </>
      ),
      desc: 'Quản lý danh sách lớp học hiện tại của bạn.',
      gif: '/Quan ly lich day.gif',
    },
    {
      label: 'Bước 2/3: Tạo lớp cố định',
      title: (
        <>
          <Calendar size={18} style={{ color: 'var(--primary, #735BF2)' }} />
          <span>Tạo lớp cố định</span>
        </>
      ),
      desc: 'Tạo lớp học định kỳ lặp lại hàng tuần dễ dàng.',
      gif: '/Tao lop co dinh.gif',
    },
    {
      label: 'Bước 3/3: Tạo lớp Extra',
      title: (
        <>
          <Sparkles size={18} style={{ color: 'var(--primary, #735BF2)' }} />
          <span>Tạo lớp Extra</span>
        </>
      ),
      desc: 'Tạo các buổi học phát sinh lẻ (lớp Extra) không cố định.',
      gif: '/Tao lop extra.gif',
    },
  ];

  const current = TOUR_STEPS[tourStep - 1];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
      zIndex: 9999, pointerEvents: 'auto',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <style>{`
        .class-tour-popup {
          position: relative;
          width: calc(100% - 32px);
          max-width: 700px;
          background-color: var(--bg-card, #fff);
          border: 2.5px solid var(--primary, #735BF2);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 10px 30px rgba(115,91,242,0.25);
          text-align: left;
          z-index: 10000;
        }
      `}</style>

      <div className="class-tour-popup" style={{ fontFamily: `ui-rounded, ${quicksand.style.fontFamily}, sans-serif` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary, #735BF2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {current.label}
          </span>
          <button type="button" onClick={handleSkipTour} style={{ background: 'none', border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            Bỏ qua
          </button>
        </div>

        <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-title, #1e293b)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {current.title}
        </h4>
        <p style={{ fontSize: '14px', lineHeight: '1.55', color: 'var(--text-main, #64748b)', marginBottom: '16px' }}>
          {current.desc}
        </p>

        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border, #e2e8f0)', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <img src={current.gif} alt={current.title} style={{ width: '100%', display: 'block' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleNextTourStep}
            style={{
              padding: '10px 20px',
              backgroundColor: tourStep === 3 ? '#00B383' : 'var(--primary, #735BF2)',
              color: '#fff', border: 'none', borderRadius: '10px',
              fontWeight: 700, cursor: 'pointer', fontSize: '14px',
              boxShadow: tourStep === 3 ? '0 4px 12px rgba(0,179,131,0.2)' : '0 4px 12px rgba(115,91,242,0.2)',
            }}
          >
            {tourStep === 3 ? 'Hoàn thành 🎉' : 'Tiếp theo ➜'}
          </button>
        </div>
      </div>
    </div>
  );
}
