import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import styles from '../styles/Calendar.module.css'
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SkeletonCard } from '../components/Loader';
import { fetchProfile, updateProfile } from '../services/profile';

declare global {
  interface Window {
    google?: any;
  }
}

interface CalendarViewProps {
  year: number;
  setYear: React.Dispatch<React.SetStateAction<number>>;
  month: number;
  setMonth: React.Dispatch<React.SetStateAction<number>>;
  selected: number;
  setSelected: React.Dispatch<React.SetStateAction<number>>;
}

interface DayInfo {
  day: number,
  month: number,
  year: number,
  isCurrentMonth: boolean
}
interface CalEvent {
  id: number,
  title: string,
  subtitle: string,
  time: string,
  color: string,
  hasViewMore?: boolean
}

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

const PALETTE = ["#00B383", "#735BF2", "#0095FF", "#FF9500", "#FF2D55", "#8E8E93"];
function getClassColor(classId: number, type?: 'FIXED' | 'EXTRA') {
  if (type === 'FIXED') {
    return '#00B383'; // Màu xanh lá cho lịch cố định
  }
  return '#FFB000'; // Vàng cho các lớp Extra hoặc linh hoạt
}

function buildCalendar(year: number, month: number): DayInfo[] {
  const first = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const prevLastDay = new Date(year, month - 1, 0).getDate()
  const offset = (first.getDay() + 6) % 7; // Mon = 0

  const res: DayInfo[] = []
  const pm = month === 1 ? 12 : month - 1
  const py = month === 1 ? year - 1 : year

  for (let i = offset - 1; i >= 0; --i)
    res.push({ day: prevLastDay - i, month: pm, year: py, isCurrentMonth: false })

  for (let d = 1; d <= daysInMonth; d++)
    res.push({ day: d, month, year, isCurrentMonth: true })

  const nm = month === 12 ? 1 : month + 1
  const ny = month === 12 ? year + 1 : year
  let nd = 1;
  while (res.length < 35)
    res.push({ day: nd++, month: nm, year: ny, isCurrentMonth: false })

  return res
}

function dateKey(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function getCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

function EventCard({ ev, onClick }: { ev: any; onClick?: () => void }) {
  const cardClassName = [
    styles.eventCard,
    ev.isCancelled ? styles.eventCardCancelled : ""
  ].filter(Boolean).join(" ");

  const timeClassName = [
    styles.cardTime,
    ev.isCancelled ? styles.cardTimeCancelled : ""
  ].filter(Boolean).join(" ");

  const titleClassName = [
    styles.cardTitle,
    ev.isCancelled ? styles.cardTitleCancelled : ""
  ].filter(Boolean).join(" ");

  const badgeClassName = [
    styles.statusBadge,
    ev.isCancelled ? styles.statusBadgeCancelled : styles.statusBadgeActive
  ].filter(Boolean).join(" ");

  return (
    <article className={cardClassName} onClick={onClick}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span
          className={styles.cardDot}
          style={{ backgroundColor: ev.color }}
        />
        <span className={timeClassName}>
          {ev.time}
        </span>
      </div>
      <h3 className={titleClassName}>
        {ev.title}
      </h3>
      {ev.isCancelled && (
        <span className={badgeClassName}>
          Nghỉ
        </span>
      )}
    </article>
  );
}

export default function CalendarView({
  year = new Date().getFullYear(),
  setYear,
  month = new Date().getMonth() + 1,
  setMonth,
  selected = new Date().getDate(),
  setSelected,
  activeNav
}: any) {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelledSessions, setCancelledSessions] = useState<Record<string, boolean>>({});

  // States for Google Calendar Sync
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load Google Identity Services library dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      const scriptEl = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (scriptEl && scriptEl.parentNode) {
        scriptEl.parentNode.removeChild(scriptEl);
      }
    };
  }, []);

  const parseGoogleError = (errorText: string): string => {
    try {
      const errObj = JSON.parse(errorText);
      if (errObj?.error) {
        const msg = errObj.error.message || '';
        const code = errObj.error.code;
        const firstReason = errObj.error.errors?.[0]?.reason || '';

        if (code === 403 && (firstReason === 'accessNotConfigured' || msg.includes('disabled') || msg.includes('not been used'))) {
          return "Google Calendar API chưa được kích hoạt trên Google Cloud Console. Vui lòng truy cập Google Cloud Console -> APIs & Services -> Library, tìm kiếm 'Google Calendar API' và nhấn 'Bật' (Enable) cho dự án của bạn.";
        }
        if (code === 401) {
          return "Phiên đăng nhập Google đã hết hạn hoặc không hợp lệ. Vui lòng thử đồng bộ lại.";
        }
        if (code === 403 && (firstReason === 'forbidden' || msg.includes('access_denied') || msg.includes('Test Users'))) {
          return "Tài khoản của bạn chưa được cấp quyền truy cập. Nếu ứng dụng đang ở chế độ thử nghiệm (Testing), vui lòng thêm email của bạn vào danh sách 'Test Users' trong phần 'OAuth consent screen' của Google Cloud Console.";
        }
        return msg || errorText;
      }
    } catch (e) {
      // Not JSON or parse failed
    }
    return errorText;
  };

  const startCalendarSync = async (accessToken: string) => {
    setSyncProgress('Đang phân tích lịch dạy...');
    const daysInMonth = new Date(year, month, 0).getDate();
    const eventsToCreate: any[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const cellDateStr = dateKey(year, month, d);
      const dateObj = new Date(year, month - 1, d);
      const dow = dateObj.getDay();

      const activeSchedules = schedules.filter((s: any) => {
        if (s.type === 'EXTRA') {
          return s.valid_from === cellDateStr;
        }
        return (
          s.day_of_week === dow &&
          s.valid_from <= cellDateStr &&
          (s.valid_to === null || cellDateStr <= s.valid_to)
        );
      });

      activeSchedules.forEach((s: any) => {
        const cancelKey = `${s.class_id}_${cellDateStr}`;
        const isCancelled = !!cancelledSessions[cancelKey];

        const startHour = s.start_time;
        const endHour = s.end_time;
        const startDateTime = `${cellDateStr}T${startHour.slice(0, 5)}:00`;
        const endDateTime = `${cellDateStr}T${endHour.slice(0, 5)}:00`;

        const summary = isCancelled ? `[Nghỉ] [Lịch Dạy] ${s.name}` : `[Lịch Dạy] ${s.name}`;
        const description = `Lớp dạy: ${s.name}\nLoại lớp: ${s.type === 'FIXED' ? 'Cố định' : 'Extra'}\nThù lao: ${s.rate_per_session.toLocaleString()}đ / buổi\nTrạng thái: ${isCancelled ? 'Đã nghỉ/hủy' : 'Hoạt động'}\n[SPeanut]`;

        let colorId = '10'; // Màu xanh lá (Basil) cho lớp FIXED
        if (isCancelled) {
          colorId = '11'; // Màu đỏ (Tomato) cho ngày nghỉ
        } else if (s.type === 'EXTRA') {
          colorId = '5'; // Màu vàng (Banana) cho lớp Extra
        }

        eventsToCreate.push({
          summary,
          description,
          colorId,
          start: {
            dateTime: startDateTime,
            timeZone: 'Asia/Ho_Chi_Minh',
          },
          end: {
            dateTime: endDateTime,
            timeZone: 'Asia/Ho_Chi_Minh',
          },
        });
      });
    }

    if (eventsToCreate.length === 0) {
      setSyncing(false);
      alert("Tháng này không có buổi dạy học nào cần đồng bộ.");
      return;
    }

    try {
      setSyncProgress('Đang tìm và xóa lịch cũ trùng lặp...');
      const timeMin = new Date(year, month - 1, 1, 0, 0, 0).toISOString();
      const timeMax = new Date(year, month, 1, 0, 0, 0).toISOString();

      const listUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&q=${encodeURIComponent('[SPeanut]')}&maxResults=2500`;
      const listRes = await fetch(listUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!listRes.ok) {
        const errorText = await listRes.text();
        console.error("Google Calendar API check failed:", errorText);
        const parsedError = parseGoogleError(errorText);
        throw new Error(parsedError);
      }

      const listData = await listRes.json();
      const oldEvents = listData.items || [];

      for (let i = 0; i < oldEvents.length; i++) {
        const evId = oldEvents[i].id;
        setSyncProgress(`Đang dọn dẹp lịch cũ trùng lặp (${i + 1}/${oldEvents.length})...`);
        const deleteUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${evId}`;
        const deleteRes = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (!deleteRes.ok) {
          console.warn(`Lỗi xóa lịch cũ ${evId}:`, await deleteRes.text());
        }
      }

      for (let i = 0; i < eventsToCreate.length; i++) {
        setSyncProgress(`Đang đồng bộ sự kiện mới (${i + 1}/${eventsToCreate.length})...`);
        const createUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events`;
        const createRes = await fetch(createUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventsToCreate[i])
        });
        if (!createRes.ok) {
          const errorText = await createRes.text();
          console.error("Lỗi tạo lịch học:", errorText);
          const parsedError = parseGoogleError(errorText);
          throw new Error(parsedError);
        }
      }

      setSyncing(false);
      alert(`Đồng bộ thành công ${eventsToCreate.length} buổi học của tháng ${month}/${year} sang Google Calendar!`);
    } catch (err: any) {
      console.error(err);
      setSyncing(false);
      alert("Lỗi khi đồng bộ Google Calendar: " + err.message);
    }
  };

  const handleGoogleSync = async () => {
    // 1. Thử đồng bộ tự động bằng token lưu trong cookie
    const providerToken = getCookie('google_provider_token');
    if (providerToken) {
      setSyncing(true);
      setSyncProgress('Đang tự động đồng bộ qua Google token...');
      try {
        await startCalendarSync(providerToken);
        return;
      } catch (err: any) {
        console.warn("Đồng bộ qua token trong cookie thất bại, chuyển sang xác thực popup:", err);
      }
    }

    // 2. Fallback sang mở popup xác thực Google (GIS)
    const clientId = (typeof window !== 'undefined' && localStorage.getItem('speanut_config_google_client_id')) || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      alert("Lỗi: Chưa cấu hình Google Client ID! Vui lòng truy cập trang /deploy để thiết lập thông số.");
      return;
    }

    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      alert("Đang tải thư viện Google, vui lòng thử lại sau vài giây...");
      return;
    }

    setSyncing(true);
    setSyncProgress('Đang kết nối tài khoản Google...');

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/calendar.events',
        callback: async (response: any) => {
          if (response.error) {
            setSyncing(false);
            alert("Lỗi xác thực Google: " + response.error);
            return;
          }
          if (response.access_token) {
            await startCalendarSync(response.access_token);
          } else {
            setSyncing(false);
          }
        },
        error_callback: (err: any) => {
          console.error("GIS OAuth error:", err);
          setSyncing(false);
          const type = err?.type || '';
          const message = err?.message || '';
          if (type === 'popup_closed_by_user' || message.includes('closed') || type.includes('close')) {
            alert("Cửa sổ đăng nhập Google đã bị đóng. Vui lòng bấm đồng bộ lại, giữ cửa sổ đăng nhập mở và hoàn tất chọn tài khoản.");
          } else if (type === 'popup_blocked_by_browser') {
            alert("Trình duyệt của bạn đã chặn cửa sổ đăng nhập (Popup Blocker). Vui lòng cho phép hiện popup và thử lại.");
          } else {
            alert("Lỗi đăng nhập Google: " + (message || type || JSON.stringify(err)));
          }
        }
      });

      client.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      console.error(err);
      setSyncing(false);
      alert("Lỗi bắt đầu đăng nhập Google.");
    }
  };

  const [profile, setProfile] = useState<any | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await fetchProfile();
        if (data && data.id) {
          setProfile(data);
          if (data.cancelled_sessions && typeof data.cancelled_sessions === 'object') {
            setCancelledSessions(data.cancelled_sessions);
            localStorage.setItem('speanut_cancelled_sessions', JSON.stringify(data.cancelled_sessions));
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải thông tin cá nhân trong Lịch dạy:", err);
      }
    }
    if (activeNav === 1) {
      loadProfile();
    }
  }, [activeNav]);

  useEffect(() => {
    const stored = localStorage.getItem('speanut_cancelled_sessions');
    if (stored) {
      try {
        setCancelledSessions(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const toggleCancelSession = async (classId: number, dateStr: string) => {
    const key = `${classId}_${dateStr}`;
    const updated = { ...cancelledSessions, [key]: !cancelledSessions[key] };

    // UI update
    setCancelledSessions(updated);
    localStorage.setItem('speanut_cancelled_sessions', JSON.stringify(updated));

    if (profile) {
      try {
        const updatedProfile = await updateProfile({
          cancelled_sessions: updated
        });
        setProfile(updatedProfile);
      } catch (err) {
        console.error("Lỗi khi đồng bộ lịch nghỉ lên server:", err);
      }
    }
  };

  useEffect(() => {
    let active = true;
    async function fetchCalendar() {
      try {
        setLoading(true);
        const res = await fetch('/api/calendar');
        if (!res.ok) throw new Error("Lỗi khi tải dữ liệu lịch biểu");
        const data = await res.json();
        if (active) {
          setSchedules(data);
          setError(null);
        }
      } catch (err: any) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    if (activeNav === 1) {
      fetchCalendar();
    }

    return () => {
      active = false;
    };
  }, [activeNav]);

  const days = buildCalendar(year, month);

  // Precompute event dots for the calendar cells
  const eventDots = useMemo(() => {
    const dotsMap: Record<string, string[]> = {};
    days.forEach(d => {
      const cellDateStr = dateKey(d.year, d.month, d.day);
      const dateObj = new Date(d.year, d.month - 1, d.day);
      const dow = dateObj.getDay(); // Sunday = 0, Monday = 1, etc.

      const activeSchedules = schedules.filter((s: any) => {
        if (s.type === 'EXTRA') {
          return s.valid_from === cellDateStr;
        }
        return (
          s.day_of_week === dow &&
          s.valid_from <= cellDateStr &&
          (s.valid_to === null || cellDateStr <= s.valid_to)
        );
      });

      // Sắp xếp lịch học theo thời gian bắt đầu tăng dần
      activeSchedules.sort((a: any, b: any) => a.start_time.localeCompare(b.start_time));

      if (activeSchedules.length > 0) {
        dotsMap[cellDateStr] = activeSchedules.map((s: any) => {
          const cancelKey = `${s.class_id}_${cellDateStr}`;
          const isCancelled = cancelledSessions[cancelKey];
          return isCancelled ? '#FF3B30' : getClassColor(s.class_id, s.type);
        });
      }
    });
    return dotsMap;
  }, [days, schedules, cancelledSessions]);

  // Compute active events for the selected day to display in the sidebar
  const selectedDayEvents = useMemo(() => {
    const cellDateStr = dateKey(year, month, selected);
    const dateObj = new Date(year, month - 1, selected);
    const dow = dateObj.getDay();

    const activeSchedules = schedules.filter((s: any) => {
      if (s.type === 'EXTRA') {
        return s.valid_from === cellDateStr;
      }
      return (
        s.day_of_week === dow &&
        s.valid_from <= cellDateStr &&
        (s.valid_to === null || cellDateStr <= s.valid_to)
      );
    });

    // Sắp xếp lịch học theo thời gian bắt đầu tăng dần
    activeSchedules.sort((a: any, b: any) => a.start_time.localeCompare(b.start_time));

    return activeSchedules.map((s: any) => {
      const start = s.start_time.slice(0, 5);
      const end = s.end_time.slice(0, 5);
      const cancelKey = `${s.class_id}_${cellDateStr}`;
      const isCancelled = !!cancelledSessions[cancelKey];

      return {
        id: s.id,
        class_id: s.class_id,
        dateStr: cellDateStr,
        title: isCancelled ? `[Nghỉ] ${s.name}` : s.name,
        subtitle: s.type === 'EXTRA'
          ? `Lớp Extra | Thù lao: ${s.rate_per_session.toLocaleString()}đ / buổi`
          : `Thù lao: ${s.rate_per_session.toLocaleString()}đ / buổi`,
        time: `${start}–${end}`,
        color: isCancelled ? '#FF3B30' : getClassColor(s.class_id, s.type),
        isCancelled: isCancelled
      };
    });
  }, [year, month, selected, schedules, cancelledSessions]);

  // Thống kê số buổi dạy theo loại lớp và số buổi nghỉ trong tháng hiện tại
  const monthlyStats = useMemo(() => {
    let fixedCount = 0;
    let extraCount = 0;
    let cancelledCount = 0;
    let totalPlannedCount = 0; // Tổng số buổi có lịch trong cả tháng (kể cả tương lai)

    const daysInMonth = new Date(year, month, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];

    for (let d = 1; d <= daysInMonth; d++) {
      const cellDateStr = dateKey(year, month, d);
      const dateObj = new Date(year, month - 1, d);
      const dow = dateObj.getDay();

      const activeSchedules = schedules.filter((s: any) => {
        if (s.type === 'EXTRA') {
          return s.valid_from === cellDateStr;
        }
        return (
          s.day_of_week === dow &&
          s.valid_from <= cellDateStr &&
          (s.valid_to === null || cellDateStr <= s.valid_to)
        );
      });

      // Cộng vào tổng kế hoạch cả tháng (không giới hạn ngày)
      totalPlannedCount += activeSchedules.length;

      // Chỉ xét các ngày từ hôm nay trở về trước để đếm đã dạy/nghỉ
      if (cellDateStr > todayStr) {
        continue;
      }

      activeSchedules.forEach((s: any) => {
        const cancelKey = `${s.class_id}_${cellDateStr}`;
        const isCancelled = !!cancelledSessions[cancelKey];

        if (isCancelled) {
          cancelledCount += 1;
        } else {
          if (s.type === 'FIXED') {
            fixedCount += 1;
          } else {
            extraCount += 1;
          }
        }
      });
    }

    const taughtCount = fixedCount + extraCount; // Số buổi đã dạy (chưa kể nghỉ)
    return {
      fixedCount,
      extraCount,
      cancelledCount,
      taughtCount,
      totalPlannedCount, // Mẫu số: tổng buổi cần dạy cả tháng
      totalCount: fixedCount + extraCount + cancelledCount // Tổng đã xử lý đến hôm nay
    };
  }, [year, month, schedules, cancelledSessions]);

  function prevMonth() {
    // 1. Tính toán tháng mới và năm mới trước
    let targetMonth = month - 1;
    let targetYear = year;

    if (month === 1) {
      targetMonth = 12;
      targetYear = year - 1;
      setYear((y: number) => y - 1);
    }
    setMonth(targetMonth);
    const maxDaysInNewMonth = new Date(targetYear, targetMonth, 0).getDate();
    if (selected > maxDaysInNewMonth) {
      setSelected(maxDaysInNewMonth);
    }
  }

  function nextMonth() {
    let targetMonth = month + 1;
    let targetYear = year;

    if (month === 12) {
      targetMonth = 1;
      targetYear = year + 1;
      setYear((y: number) => y + 1);
    }
    setMonth(targetMonth);

    const maxDaysInNewMonth = new Date(targetYear, targetMonth, 0).getDate();

    if (selected > maxDaysInNewMonth) {
      setSelected(maxDaysInNewMonth);
    }
  }

  const portalRoot = typeof document !== 'undefined' ? document.getElementById('top-left-portal-root') : null;
  const syncBtnNode = !loading && !error ? (
    <div className={styles.topLeftSyncContainer}>
      <button
        type="button"
        className={styles.syncBtnTop}
        onClick={handleGoogleSync}
        disabled={syncing}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" style={{ marginRight: '4px' }}>
          <path fill="#4285F4" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
        </svg>
        {syncing ? 'Đang đồng bộ...' : 'Đồng bộ Google'}
      </button>
      {syncing && (
        <span className={styles.syncProgressInline}>
          {syncProgress}
        </span>
      )}
    </div>
  ) : null;

  return (
    <div className={styles.mainContent}>
      {mounted && activeNav === 1 && portalRoot && syncBtnNode ? createPortal(syncBtnNode, portalRoot) : null}
      <section className={styles.calendarShell}>
        <div className={styles.monthHeader}>
          <button
            className={styles.iconBtn}
            onClick={prevMonth}
            aria-label="Previous month"
          >
            <ChevronLeft />
          </button>

          <div className={styles.monthLabel}>
            <p className={styles.monthName}>{MONTHS[month - 1]}</p>
            <p className={styles.monthYear}>{year}</p>
          </div>

          <button
            className={styles.iconBtn}
            onClick={nextMonth}
            aria-label="Next month"
          >
            <ChevronRight />
          </button>
        </div>

        <div className={styles.weekdays}>
          {WEEKDAYS.map((d) => (
            <div key={d} className={styles.weekday}>{d}</div>
          ))}
        </div>

        <div className={styles.calGrid}>
          {days.map((d, idx) => {
            const key = dateKey(d.year, d.month, d.day);
            const dots = eventDots[key] || [];
            const isSel = d.isCurrentMonth && d.day === selected && d.month === month;

            const cellClass = [
              styles.dayCell,
              !d.isCurrentMonth ? styles.otherMonth : "",
            ].filter(Boolean).join(" ");

            const numClass = [
              styles.dayNumber,
              isSel ? styles.selected : "",
              !d.isCurrentMonth ? styles.otherDay : "",
            ].filter(Boolean).join(" ");

            return (
              <div
                key={idx}
                className={cellClass}
                onClick={() => {
                  if (!d.isCurrentMonth) {
                    setYear(d.year);
                    setMonth(d.month);
                  }
                  setSelected(d.day);
                }}
                role="button"
                tabIndex={0}
                aria-label={`${d.day} ${MONTHS[d.month - 1]} ${d.year}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (!d.isCurrentMonth) {
                      setYear(d.year);
                      setMonth(d.month);
                    }
                    setSelected(d.day);
                  }
                }}
              >
                <span className={numClass}>{d.day}</span>

                <div className={styles.dotsRow}>
                  {dots.slice(0, 3).map((color, i) => (
                    <span
                      key={i}
                      className={styles.dot}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.dragWrap}>
          <div className={styles.dragPill} />
        </div>
      </section>

      <aside className={styles.eventPanel}>
        <div className={styles.eventList}>
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : error ? (
            <p className={styles.noEventsText} style={{ color: 'var(--red, #ff4d4f)' }}>Có lỗi xảy ra: {error}</p>
          ) : selectedDayEvents.length > 0 ? (
            selectedDayEvents.map((ev: any) => (
              <EventCard key={ev.id} ev={ev} onClick={() => toggleCancelSession(ev.class_id, ev.dateStr)} />
            ))
          ) : (
            <p className={styles.noEventsText}>Không có lớp học nào vào ngày này.</p>
          )}

          {/* Thống kê tiến độ số buổi dạy trong tháng */}
          {!loading && !error && (
            <div className={styles.statsCard}>
              <div className={styles.statsHeader}>
                <span className={styles.statsTitle}>Dạy trong tháng {month}/{year}</span>
                <span className={styles.statsTotalCount}>
                  {monthlyStats.taughtCount} / {monthlyStats.totalPlannedCount} buổi
                </span>
              </div>

              <div className={styles.progressBarWrapper}>
                {monthlyStats.totalPlannedCount > 0 ? (
                  <>
                    {monthlyStats.fixedCount > 0 && (
                      <div
                        className={styles.progressBarSegment}
                        style={{
                          width: `${(monthlyStats.fixedCount / monthlyStats.totalPlannedCount) * 100}%`,
                          backgroundColor: '#00B383'
                        }}
                        title={`Lớp cố định: ${monthlyStats.fixedCount} buổi`}
                      />
                    )}
                    {monthlyStats.extraCount > 0 && (
                      <div
                        className={styles.progressBarSegment}
                        style={{
                          width: `${(monthlyStats.extraCount / monthlyStats.totalPlannedCount) * 100}%`,
                          backgroundColor: '#FFB000'
                        }}
                        title={`Lớp Extra: ${monthlyStats.extraCount} buổi`}
                      />
                    )}
                    {monthlyStats.cancelledCount > 0 && (
                      <div
                        className={styles.progressBarSegment}
                        style={{
                          width: `${(monthlyStats.cancelledCount / monthlyStats.totalPlannedCount) * 100}%`,
                          backgroundColor: '#FF3B30'
                        }}
                        title={`Nghỉ: ${monthlyStats.cancelledCount} buổi`}
                      />
                    )}
                  </>
                ) : (
                  <div className={styles.progressBarEmpty} />
                )}
              </div>

              <div className={styles.statsLegend}>
                {monthlyStats.fixedCount > 0 && (
                  <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ backgroundColor: '#00B383' }} />
                    <span className={styles.legendName}>Lớp cố định</span>
                    <span className={styles.legendValue}>{monthlyStats.fixedCount} buổi</span>
                  </div>
                )}
                {monthlyStats.extraCount > 0 && (
                  <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ backgroundColor: '#FFB000' }} />
                    <span className={styles.legendName}>Lớp Extra</span>
                    <span className={styles.legendValue}>{monthlyStats.extraCount} buổi</span>
                  </div>
                )}
                {monthlyStats.cancelledCount > 0 && (
                  <div className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ backgroundColor: '#FF3B30' }} />
                    <span className={styles.legendName} style={{ color: '#FF3B30' }}>Số buổi nghỉ</span>
                    <span className={styles.legendValue} style={{ color: '#FF3B30' }}>{monthlyStats.cancelledCount} buổi</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </aside>
    </div>
  );
}