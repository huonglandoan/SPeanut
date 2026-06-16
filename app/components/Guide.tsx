// app/components/Guide.tsx
"use client";

import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, BookOpen, User, RefreshCw, Sparkles, Heart } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'intro' | 'tour'>('intro');

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

  const handleStartTour = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('speanut_tour_mode', 'true');
      localStorage.setItem('speanut_active_tour', 'true');
      localStorage.setItem('speanut_tour_step', '1');
      if (setActiveNav) setActiveNav(1); // Mặc định chuyển sang Lịch dạy
      onClose();
      window.location.reload(); // Reload để khởi động tour mode sạch sẽ
    }
  };

  return (
    <div className={profileStyles.modalOverlay} onClick={onClose}>
      <div
        className={profileStyles.modalContent}
        style={{ maxWidth: '600px', borderRadius: '24px', fontFamily: `ui-rounded, ${quicksand.style.fontFamily}, sans-serif` }}
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

        <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-title, #1e293b)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ✨ Hướng dẫn & Chạy thử
        </h3>

        {/* Tab Headers */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border, #e2e8f0)',
          marginBottom: '20px',
          gap: '4px',
        }}>
          <button type="button" onClick={() => setActiveTab('intro')} style={tabStyle('intro')}>
            Giới thiệu SPeanut
          </button>
          <button type="button" onClick={() => setActiveTab('tour')} style={tabStyle('tour')}>
            Các bước Tour chạy thử
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-main, #64748b)', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
          {activeTab === 'intro' && (
            <div>
              <p style={{ marginBottom: '14px' }}>
                Chào mừng bạn đến với <strong>SPeanut</strong>! Đây là hệ thống quản lý lịch giảng dạy và tự động tính lương thông minh dành cho giáo viên và gia sư.
              </p>
              
              <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(115,91,242,0.04)', border: '1px solid rgba(115,91,242,0.08)' }}>
                  <Calendar size={20} style={{ color: 'var(--primary, #735BF2)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: 'var(--text-title, #1e293b)', display: 'block', marginBottom: '2px' }}>Quản lý Lịch dạy & Báo nghỉ</strong>
                    Theo dõi chấm công, click chọn ngày nghỉ trực tiếp để hệ thống tự động loại trừ khỏi quỹ thù lao.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(115,91,242,0.04)', border: '1px solid rgba(115,91,242,0.08)' }}>
                  <RefreshCw size={20} style={{ color: 'var(--primary, #735BF2)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: 'var(--text-title, #1e293b)', display: 'block', marginBottom: '2px' }}>Đồng bộ Google Calendar</strong>
                    Đẩy toàn bộ lịch học và lịch nghỉ sang điện thoại cá nhân thông qua Google Calendar chỉ với 1 click.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(115,91,242,0.04)', border: '1px solid rgba(115,91,242,0.08)' }}>
                  <Heart size={20} style={{ color: 'var(--primary, #735BF2)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: 'var(--text-title, #1e293b)', display: 'block', marginBottom: '2px' }}>Trợ lý ảo Peanut AI</strong>
                    Tự động tạo lớp học cố định/Extra, điều chỉnh thù lao và tính lương thông minh bằng câu nói tự nhiên.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(115,91,242,0.04)', border: '1px solid rgba(115,91,242,0.08)' }}>
                  <BookOpen size={20} style={{ color: 'var(--primary, #735BF2)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: 'var(--text-title, #1e293b)', display: 'block', marginBottom: '2px' }}>Lớp Cố định & Lớp Extra</strong>
                    Lớp cố định lặp lại đều đặn hàng tuần, tự động sinh lịch cả tháng. Lớp Extra là buổi học phát sinh lẻ, chỉ diễn ra duy nhất 1 lần (ví dụ: học bù, dạy lẻ).
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tour' && (
            <div>
              <p style={{ marginBottom: '14px' }}>
                Hệ thống hỗ trợ <strong>Chế độ Chạy thử Tương tác (Tour Mode)</strong>. Bạn sẽ được hướng dẫn trực tiếp thực hiện các hành động thực tế trên giao diện để làm quen với hệ thống:
              </p>
              <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Bước 1 - 4: Lịch dạy</strong> (Đổi giao diện tối, nhấp chọn ngày có lớp dạy, báo nghỉ dạy trực tiếp trên thẻ, và bấm chạy thử đồng bộ Google).</li>
                <li><strong>Bước 5 - 7: Tạo lớp mới</strong> (Điều hướng trang lớp học, mở biểu mẫu tạo lớp, và lưu lớp học mẫu vào lịch).</li>
                <li><strong>Bước 8 - 10: Peanut AI</strong> (Mở trợ lý ảo AI, kích hoạt chế độ Demo và thử các câu gợi ý tính lương nhanh).</li>
              </ol>
              <p style={{ marginTop: '12px', fontSize: '12.5px', fontStyle: 'italic', color: 'var(--text-muted, #94a3b8)' }}>
                * Mọi thao tác trong quá trình chạy thử chỉ được lưu trữ tạm thời trên trình duyệt của bạn và sẽ được khôi phục nguyên vẹn ngay khi kết thúc tour.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
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
            onClick={handleStartTour}
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
            <span>Bắt đầu Tour Chạy thử 🚀</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Interactive Tour ─────────────────────────── */

interface TourStep {
  selector: string | null;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  title: string;
  desc: string;
  expectedEvent: string;
  expectedEventData?: any;
}

export function InteractiveTour({ activeNav, setActiveNav }: { activeNav: number; setActiveNav?: React.Dispatch<React.SetStateAction<number>> }) {
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(1);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const [popupHeight, setPopupHeight] = useState(160);

  // 10 Bước trong Tour tương tác trực tiếp trên giao diện thực tế
  const TOUR_STEPS: TourStep[] = useMemo(() => [
    {
      selector: '#tour-theme-switcher',
      placement: 'bottom',
      title: 'Bước 1: Chuyển đổi giao diện ☀️🌙',
      desc: 'Hãy thử nhấp vào nút Sáng / Tối ở góc trên màn hình để thay đổi chế độ hiển thị.',
      expectedEvent: 'theme_changed'
    },
    {
      selector: '[data-tour-has-events="true"]',
      placement: 'bottom',
      title: 'Bước 2: Chọn một ngày trên lịch 📅',
      desc: 'Các chấm tròn xanh lá là các lớp dạy học. Hãy nhấp vào một ngày có chấm tròn xanh trên lịch biểu để xem chi tiết buổi học ở cột bên phải.',
      expectedEvent: 'day_selected'
    },
    {
      selector: '#tour-event-card',
      placement: 'left',
      title: 'Bước 3: Đánh dấu nghỉ học ❌',
      desc: 'Đây là buổi học chi tiết của ngày bạn chọn. Hãy nhấp vào thẻ buổi học này để báo nghỉ. Thẻ sẽ đổi đỏ, tự động ghi chú [Nghỉ] và cập nhật giảm trừ lương thực nhận.',
      expectedEvent: 'session_toggled'
    },
    {
      selector: '#tour-sync-btn',
      placement: 'bottom',
      title: 'Bước 4: Đồng bộ Google Calendar 🔄',
      desc: 'Tuyệt vời! Hãy nhấp nút "Đồng bộ Google" để kiểm tra tính năng xuất lịch dạy tự động sang điện thoại cá nhân của bạn.',
      expectedEvent: 'google_sync_clicked'
    },
    {
      selector: '#tour-nav-class',
      placement: 'top',
      title: 'Bước 5: Trang quản lý lớp học 📚',
      desc: 'Đã giả lập đồng bộ thành công! Bây giờ hãy chuyển sang trang Lớp học bằng cách nhấp vào biểu tượng Lớp học ở menu thanh ngang dưới cùng.',
      expectedEvent: 'nav_changed',
      expectedEventData: 0
    },
    {
      selector: '#tour-create-class-tab',
      placement: 'bottom',
      title: 'Bước 6: Tạo lớp mới ➕',
      desc: 'Nhấp vào nút "Tạo lớp mới" ở đầu danh sách để mở bảng đăng ký thông tin lớp học.',
      expectedEvent: 'class_tab_changed'
    },
    {
      selector: '#tour-create-class-submit',
      placement: 'top',
      title: 'Bước 7: Chọn loại lớp & Tạo lớp 📝',
      desc: 'Hệ thống đã tự động điền sẵn thông tin mẫu của lớp Hóa 10.\n\n💡 Phân biệt loại lớp học:\n- Lớp cố định (Fixed): Lớp diễn ra lặp lại hàng tuần vào thứ được chọn (ví dụ: thứ 2, thứ 4). Lịch học tự động sinh cho cả tháng.\n- Lớp Extra: Buổi phát sinh lẻ, chỉ diễn ra duy nhất vào một ngày cụ thể (ví dụ: dạy bù, dạy lẻ).\n\nHãy nhấp nút "KHỞI TẠO LỚP HỌC" để thêm lớp này vào lịch!',
      expectedEvent: 'class_created'
    },
    {
      selector: '#tour-ai-trigger',
      placement: 'top',
      title: 'Bước 8: Trợ lý thông minh Peanut AI 💜',
      desc: 'Lớp mới đã được tạo và tự động phân bổ vào lịch dạy. Hãy mở Trợ lý ảo Peanut AI bằng cách bấm vào biểu tượng Trái tim màu tím ở góc dưới.',
      expectedEvent: 'ai_opened'
    },
    {
      selector: '#tour-ai-demo-btn',
      placement: 'top',
      title: 'Bước 9: Khởi động chạy thử Trợ lý 🤖',
      desc: 'Nhấp vào nút "Bắt đầu Chạy thử Tương tác (Demo)" để kích hoạt trình phân tích tự động.',
      expectedEvent: 'ai_demo_started'
    },
    {
      selector: '#tour-ai-suggestions',
      placement: 'top',
      title: 'Bước 10: Ra lệnh thử cho Peanut AI 🎉',
      desc: 'Hãy nhấp vào một trong các câu lệnh gợi ý nhanh màu xám ở dưới (ví dụ: "Tính lương") để trợ lý trả lời tức thì. Sau đó nhấp Hoàn thành để kết thúc tour trải nghiệm!',
      expectedEvent: 'ai_message_sent'
    }
  ], []);

  const current = TOUR_STEPS[tourStep - 1];

  // Khởi tạo trạng thái và check tour_mode
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const activeTour = localStorage.getItem('speanut_active_tour') === 'true';
      const step = parseInt(localStorage.getItem('speanut_tour_step') || '1', 10);
      setIsTourActive(activeTour);
      setTourStep(step);

      // Check Mobile
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
    return () => setMounted(false);
  }, [activeNav]);

  // Thường xuyên cập nhật chiều cao thực tế của bong bóng để tính tọa độ chính xác
  useLayoutEffect(() => {
    if (cardRef.current) {
      setPopupHeight(cardRef.current.offsetHeight);
    }
  }, [tourStep, targetRect]);

  // Lắng nghe sự kiện để tiến bước
  useEffect(() => {
    if (!isTourActive) return;

    const handleTourEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { type, mode, day, activeNav: currentNav, activeTab } = customEvent.detail || {};

      if (current.expectedEvent === 'theme_changed' && type === 'theme_changed') {
        handleNextStep();
      } else if (current.expectedEvent === 'day_selected' && type === 'day_selected') {
        handleNextStep();
      } else if (current.expectedEvent === 'session_toggled' && type === 'session_toggled') {
        handleNextStep();
      } else if (current.expectedEvent === 'google_sync_clicked' && type === 'google_sync_clicked') {
        handleNextStep();
      } else if (current.expectedEvent === 'nav_changed' && type === 'nav_changed' && currentNav === current.expectedEventData) {
        handleNextStep();
      } else if (current.expectedEvent === 'class_tab_changed' && type === 'class_tab_changed') {
        handleNextStep();
      } else if (current.expectedEvent === 'class_created' && type === 'class_created') {
        handleNextStep();
      } else if (current.expectedEvent === 'ai_opened' && type === 'ai_opened') {
        handleNextStep();
      } else if (current.expectedEvent === 'ai_demo_started' && type === 'ai_demo_started') {
        handleNextStep();
      } else if (current.expectedEvent === 'ai_message_sent' && type === 'ai_message_sent') {
        // Cuối cùng: cho phép bấm Hoàn thành ở UI
      }
    };

    window.addEventListener('speanut_tour_event', handleTourEvent);
    return () => {
      window.removeEventListener('speanut_tour_event', handleTourEvent);
    };
  }, [isTourActive, tourStep, current]);

  // Đo tọa độ phần tử active
  useLayoutEffect(() => {
    if (!isTourActive || !current.selector) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const el = document.querySelector(current.selector as string);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    updateRect();
    const interval = setInterval(updateRect, 300);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [isTourActive, tourStep, current.selector]);

  // Thêm viền phát sáng (highlight) cho phần tử được chọn
  useEffect(() => {
    if (!isTourActive || !current.selector) return;

    const el = document.querySelector(current.selector) as HTMLElement;
    if (el) {
      el.classList.add('tour-highlight');
    }

    return () => {
      if (el) {
        el.classList.remove('tour-highlight');
      }
    };
  }, [isTourActive, tourStep, current.selector]);

  const handleNextStep = () => {
    const nextStep = tourStep + 1;
    if (nextStep > 10) {
      handleCompleteTour();
    } else {
      setTourStep(nextStep);
      localStorage.setItem('speanut_tour_step', String(nextStep));
    }
  };

  const handleCompleteTour = () => {
    setIsTourActive(false);
    localStorage.removeItem('speanut_tour_mode');
    localStorage.removeItem('speanut_active_tour');
    localStorage.removeItem('speanut_tour_step');
    localStorage.removeItem('speanut_tour_classes');
    localStorage.removeItem('speanut_tour_schedules');
    localStorage.removeItem('speanut_cancelled_sessions');
    alert("🎉 Chúc mừng bạn đã hoàn thành Tour hướng dẫn SPeanut!");
    window.location.reload(); // Reload để phục hồi dữ liệu thật từ DB
  };

  const handleSkipTour = () => {
    if (confirm("Bạn có chắc muốn thoát tour chạy thử?")) {
      setIsTourActive(false);
      localStorage.removeItem('speanut_tour_mode');
      localStorage.removeItem('speanut_active_tour');
      localStorage.removeItem('speanut_tour_step');
      localStorage.removeItem('speanut_tour_classes');
      localStorage.removeItem('speanut_tour_schedules');
      localStorage.removeItem('speanut_cancelled_sessions');
      window.location.reload(); // Reload để phục hồi dữ liệu thật từ DB
    }
  };

  if (!isTourActive || !mounted) return null;

  // Tính toán vị trí bong bóng hội thoại tour (desktop & mobile)
  const getBubbleStyle = (): React.CSSProperties => {
    // Nếu ở trên điện thoại (Mobile) hoặc màn hình hẹp
    if (isMobile) {
      // Xác định xem mục tiêu có nằm ở nửa dưới màn hình không (như menu bottom ở Bước 5)
      // Nếu có, đẩy bong bóng lên ĐẦU màn hình để tránh che mất phần tử cần nhấp.
      const isTargetAtBottom = targetRect ? (targetRect.top > window.innerHeight / 2) : false;
      return {
        position: 'fixed',
        top: isTargetAtBottom ? '80px' : 'auto',
        bottom: isTargetAtBottom ? 'auto' : '16px',
        left: '16px',
        right: '16px',
        width: 'auto',
        maxWidth: 'none',
        backgroundColor: 'var(--bg-card, #fff)',
        border: '2.5px solid var(--primary, #735BF2)',
        borderRadius: '20px',
        padding: '16px',
        boxShadow: '0 8px 32px rgba(115,91,242,0.3)',
        zIndex: 100000, // Cao hơn backdrop
      };
    }

    if (!targetRect) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '340px',
        backgroundColor: 'var(--bg-card, #fff)',
        border: '2.5px solid var(--primary, #735BF2)',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: '0 8px 32px rgba(115,91,242,0.3)',
        zIndex: 100000,
      };
    }

    const pad = 12;
    const popupWidth = 340;
    let top = 0;
    let left = 0;

    const { placement } = current;

    if (placement === 'bottom') {
      top = targetRect.bottom + pad;
      left = targetRect.left + targetRect.width / 2 - popupWidth / 2;
    } else if (placement === 'top') {
      top = targetRect.top - popupHeight - pad; 
      left = targetRect.left + targetRect.width / 2 - popupWidth / 2;
    } else if (placement === 'left') {
      top = targetRect.top + targetRect.height / 2 - popupHeight / 2;
      left = targetRect.left - popupWidth - pad;
    } else if (placement === 'right') {
      top = targetRect.top + targetRect.height / 2 - popupHeight / 2;
      left = targetRect.right + pad;
    } else {
      // center
      top = window.innerHeight / 2 - popupHeight / 2;
      left = window.innerWidth / 2 - popupWidth / 2;
    }

    // Đảm bảo không tràn viền màn hình
    left = Math.max(16, Math.min(left, window.innerWidth - popupWidth - 16));
    top = Math.max(80, Math.min(top, window.innerHeight - popupHeight - 40));

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${popupWidth}px`,
      backgroundColor: 'var(--bg-card, #fff)',
      border: '2.5px solid var(--primary, #735BF2)',
      borderRadius: '20px',
      padding: '20px',
      boxShadow: '0 8px 32px rgba(115,91,242,0.3)',
      zIndex: 100000,
    };
  };

  // Sử dụng React Portal để gắn trực tiếp thẻ hướng dẫn vào body.
  // Điều này khắc phục triệt để lỗi Stacking Context (bước 3 bị che bởi Sidebar Lịch dạy).
  return createPortal(
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(1px)',
        zIndex: 99998, pointerEvents: 'none', // Cho phép nhấp xuyên qua backdrop vào các phần tử bên dưới
      }}>
        <style>{`
          .tour-highlight {
            position: relative !important;
            z-index: 99999 !important; /* Cao hơn backdrop (99998) nhưng thấp hơn card (100000) */
            box-shadow: 0 0 0 4px rgba(115, 91, 242, 0.6) !important;
            animation: tour-pulse 2s infinite !important;
            pointer-events: auto !important; /* Cho phép tương tác trực tiếp */
            background-color: var(--bg-card, #fff) !important;
          }
          @keyframes tour-pulse {
            0% { box-shadow: 0 0 0 0px rgba(115, 91, 242, 0.6); }
            70% { box-shadow: 0 0 0 10px rgba(115, 91, 242, 0); }
            100% { box-shadow: 0 0 0 0px rgba(115, 91, 242, 0); }
          }
          .tour-bubble-btn {
            pointer-events: auto;
            padding: 8px 14px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 13px;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
          }
          .tour-bubble-btn-next {
            background-color: var(--primary, #735BF2);
            color: white;
          }
          .tour-bubble-btn-next:hover {
            background-color: #5c45db;
          }
          .tour-bubble-btn-skip {
            background: none;
            color: var(--text-muted, #94a3b8);
            font-weight: 600;
          }
        `}</style>
      </div>

      <div ref={cardRef} style={{ ...getBubbleStyle(), pointerEvents: 'auto', fontFamily: `ui-rounded, ${quicksand.style.fontFamily}, sans-serif` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary, #735BF2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Bước {tourStep} / 10
          </span>
          <button type="button" onClick={handleSkipTour} className="tour-bubble-btn tour-bubble-btn-skip" style={{ padding: '2px 6px' }}>
            Bỏ qua
          </button>
        </div>

        <h4 style={{ fontSize: '15px', fontWeight: 850, color: 'var(--text-title, #1e293b)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {current.title}
        </h4>
        <p style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-main, #64748b)', marginBottom: '16px' }}>
          {current.desc}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', fontWeight: 500 }}>
            {tourStep === 10 ? '✨ Đã sẵn sàng!' : '👉 Thực hiện để tự tiến bước'}
          </span>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Hỗ trợ nút bỏ qua bước thủ công nếu người dùng bị kẹt */}
            {(tourStep === 10 || tourStep === 9) ? (
              <button
                type="button"
                onClick={handleCompleteTour}
                className="tour-bubble-btn tour-bubble-btn-next"
                style={{ backgroundColor: '#00B383' }}
              >
                Hoàn thành 🎉
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextStep}
                className="tour-bubble-btn tour-bubble-btn-next"
                style={{ fontSize: '11px', opacity: 0.7, padding: '6px 10px' }}
                title="Bấm để bỏ qua bước này nếu bị kẹt"
              >
                Kẹt? Bỏ qua bước ➜
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// Giữ nguyên export trống để không gây lỗi biên dịch ở page.tsx
export function ClassTour({ activeNav }: { activeNav: number }) {
  return null;
}
